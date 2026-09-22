import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Inject, Logger, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserStatus } from "@repo/types";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../common/auth.types";
import { toAuthUser } from "../common/user.mapper";
import { getCorsOrigins } from "../common/web-origin";
import { ChatService } from "./chat.service";

type ChatSocket = Socket & { data: { user?: AuthUser } };

export type ChatMessageEvent = {
  conversationId: string;
  message: {
    id: string;
    body: string;
    senderId: string;
    senderName: string;
    senderProfilePicUrl: string | null;
    createdAt: string;
  };
};

function socketCorsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  // React Native / Expo often omits Origin.
  if (!origin) {
    callback(null, true);
    return;
  }
  const allowed = getCorsOrigins();
  if (allowed === "*" || (Array.isArray(allowed) ? allowed.includes(origin) : allowed === origin)) {
    callback(null, true);
    return;
  }
  callback(null, true);
}

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: socketCorsOrigin,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: ChatSocket) {
    try {
      const user = await this.authenticate(client);
      client.data.user = user;
      await client.join(this.userRoom(user.id));

      const conversationIds = await this.chatService.listConversationIdsForUser(user.id);
      await Promise.all(
        conversationIds.map((conversationId) =>
          client.join(this.conversationRoom(conversationId)),
        ),
      );

      this.logger.debug(`Chat socket connected: ${user.id}`);
    } catch (err) {
      this.logger.warn(
        `Chat socket rejected: ${err instanceof Error ? err.message : "unknown"}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: ChatSocket) {
    const userId = client.data.user?.id;
    if (userId) {
      this.logger.debug(`Chat socket disconnected: ${userId}`);
    }
  }

  @SubscribeMessage("chat:join")
  async joinConversation(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const user = client.data.user;
    if (!user || !body?.conversationId) return { ok: false };
    await this.chatService.assertUserInConversation(user.id, body.conversationId);
    await client.join(this.conversationRoom(body.conversationId));
    return { ok: true };
  }

  emitMessage(conversationId: string, event: ChatMessageEvent) {
    this.server
      .to(this.conversationRoom(conversationId))
      .emit("chat:message", event);
  }

  emitInboxBump(userIds: string[], conversationId: string) {
    for (const userId of userIds) {
      this.server.to(this.userRoom(userId)).emit("chat:inbox", { conversationId });
    }
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private conversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private async authenticate(client: ChatSocket): Promise<AuthUser> {
    const raw =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined) ??
      client.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!raw) {
      throw new Error("Missing auth token");
    }

    const payload = await this.jwt.verifyAsync<{ sub: string }>(raw, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { state: true, zone: true, branch: true },
    });
    if (!user) {
      throw new Error("User not found");
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error("Account not active");
    }
    return toAuthUser(user);
  }
}
