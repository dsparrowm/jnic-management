import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { ConversationType, ChatReceiptStatus, Role, UserStatus } from "@repo/types";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../common/auth.types";
import { ChatGateway } from "./chat.gateway";
import { ListChatMessagesDto, SendChatMessageDto } from "./dto/chat.dto";

const MESSAGING_ROLES: Role[] = [
  Role.LEAD_PASTOR,
  Role.ADMIN,
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.BRANCH_PASTOR,
];

function directKeyFor(userA: string, userB: string): string {
  return [userA, userB].sort().join(":");
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async getUnreadCount(userId: string) {
    await this.syncRoomsForUser(userId);
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });
    let unreadCount = 0;
    for (const row of participations) {
      unreadCount += await this.prisma.chatMessage.count({
        where: {
          conversationId: row.conversationId,
          senderId: { not: userId },
          ...(row.lastReadAt ? { createdAt: { gt: row.lastReadAt } } : {}),
        },
      });
    }
    return { unreadCount };
  }

  async getInbox(user: AuthUser) {
    await this.syncRoomsForUser(user.id);
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            zone: true,
            state: true,
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: { select: { id: true, name: true } },
                receipts: { select: { deliveredAt: true, readAt: true } },
              },
            },
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, profilePicUrl: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    const items = await Promise.all(
      participations.map(async (row) => {
        const conversation = row.conversation;
        const last = conversation.messages[0] ?? null;
        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: user.id },
            ...(row.lastReadAt ? { createdAt: { gt: row.lastReadAt } } : {}),
          },
        });

        const peer =
          conversation.type === ConversationType.DIRECT
            ? (conversation.participants
                .map((p) => p.user)
                .find((p) => p.id !== user.id) ?? null)
            : null;

        return {
          id: conversation.id,
          type: conversation.type,
          title: this.conversationTitle(conversation, peer?.name ?? null),
          lastMessage: last
            ? {
                id: last.id,
                body: last.body,
                senderId: last.senderId,
                senderName: last.sender.name,
                createdAt: last.createdAt.toISOString(),
                receiptStatus:
                  last.senderId === user.id
                    ? this.aggregateReceiptStatus(last.receipts)
                    : null,
              }
            : null,
          unreadCount,
          updatedAt: (conversation.lastMessageAt ?? conversation.createdAt).toISOString(),
          peer: peer
            ? {
                id: peer.id,
                name: peer.name,
                profilePicUrl: peer.profilePicUrl,
                role: peer.role,
              }
            : null,
        };
      }),
    );

    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const unreadCount = items.reduce((sum, item) => sum + item.unreadCount, 0);
    return { items, unreadCount };
  }

  async createDirect(user: AuthUser, targetUserId: string) {
    if (targetUserId === user.id) {
      throw new BadRequestException("You cannot message yourself");
    }
    await this.assertCanMessage(user);
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target || target.status !== UserStatus.ACTIVE) {
      throw new NotFoundException("Pastor not found");
    }
    if (!MESSAGING_ROLES.includes(target.role as Role)) {
      throw new BadRequestException("That user cannot receive messages");
    }

    const directKey = directKeyFor(user.id, targetUserId);
    let conversation = await this.prisma.conversation.findUnique({
      where: { directKey },
    });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          type: ConversationType.DIRECT,
          directKey,
          title: null,
          participants: {
            create: [{ userId: user.id }, { userId: targetUserId }],
          },
        },
      });
    } else {
      await this.syncParticipants(conversation.id, [user.id, targetUserId]);
    }

    return {
      id: conversation.id,
      type: ConversationType.DIRECT,
      title: target.name,
    };
  }

  async getMessages(user: AuthUser, conversationId: string, query: ListChatMessagesDto) {
    await this.assertParticipant(user.id, conversationId);
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 50;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        zone: true,
        state: true,
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    const peerName =
      conversation.type === ConversationType.DIRECT
        ? (conversation.participants.find((p) => p.userId !== user.id)?.user.name ?? null)
        : null;

    const [items, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, name: true, profilePicUrl: true } },
          receipts: { select: { deliveredAt: true, readAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.chatMessage.count({ where: { conversationId } }),
    ]);

    return {
      items: items.reverse().map((message) => ({
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderProfilePicUrl: message.sender.profilePicUrl,
        createdAt: message.createdAt.toISOString(),
        mine: message.senderId === user.id,
        receiptStatus:
          message.senderId === user.id
            ? this.aggregateReceiptStatus(message.receipts)
            : null,
      })),
      total,
      page,
      perPage,
      conversation: {
        id: conversation.id,
        type: conversation.type,
        title: this.conversationTitle(conversation, peerName),
      },
    };
  }

  async sendMessage(user: AuthUser, conversationId: string, dto: SendChatMessageDto) {
    await this.assertCanMessage(user);
    await this.assertParticipant(user.id, conversationId);
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException("Message cannot be empty");
    }

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const recipientIds = participants
      .map((p) => p.userId)
      .filter((id) => id !== user.id);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId: user.id,
          body,
          receipts: {
            create: recipientIds.map((userId) => ({ userId })),
          },
        },
        include: {
          sender: { select: { id: true, name: true, profilePicUrl: true } },
          receipts: { select: { deliveredAt: true, readAt: true } },
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });
      await tx.conversationParticipant.updateMany({
        where: { conversationId, userId: user.id },
        data: { lastReadAt: created.createdAt },
      });
      return created;
    });

    const payload = {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderProfilePicUrl: message.sender.profilePicUrl,
      createdAt: message.createdAt.toISOString(),
      mine: true,
      receiptStatus: this.aggregateReceiptStatus(message.receipts),
    };

    this.chatGateway.emitMessage(conversationId, {
      conversationId,
      message: {
        id: payload.id,
        body: payload.body,
        senderId: payload.senderId,
        senderName: payload.senderName,
        senderProfilePicUrl: payload.senderProfilePicUrl,
        createdAt: payload.createdAt,
        receiptStatus: null,
      },
    });
    this.chatGateway.emitInboxBump(
      participants.map((p) => p.userId),
      conversationId,
    );

    return payload;
  }

  async markDelivered(userId: string, messageId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true, senderId: true },
    });
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    if (message.senderId === userId) {
      return { ok: true };
    }
    await this.assertParticipant(userId, message.conversationId);

    const now = new Date();
    await this.prisma.chatMessageReceipt.updateMany({
      where: {
        messageId,
        userId,
        deliveredAt: null,
      },
      data: { deliveredAt: now },
    });

    const status = await this.getMessageReceiptStatus(messageId);
    this.chatGateway.emitReceipt({
      conversationId: message.conversationId,
      messageId,
      status,
    });
    return { ok: true, status };
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
    const lastMessage = await this.prisma.chatMessage.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
    });
    const now = new Date();
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: lastMessage?.createdAt ?? now },
    });

    const pending = await this.prisma.chatMessageReceipt.findMany({
      where: {
        userId,
        readAt: null,
        message: { conversationId, senderId: { not: userId } },
      },
      select: { messageId: true },
    });
    if (pending.length === 0) {
      return { ok: true };
    }

    await this.prisma.chatMessageReceipt.updateMany({
      where: {
        userId,
        messageId: { in: pending.map((row) => row.messageId) },
      },
      data: {
        deliveredAt: now,
        readAt: now,
      },
    });

    const uniqueMessageIds = [...new Set(pending.map((row) => row.messageId))];
    for (const messageId of uniqueMessageIds) {
      const status = await this.getMessageReceiptStatus(messageId);
      this.chatGateway.emitReceipt({
        conversationId,
        messageId,
        status,
      });
    }
    return { ok: true };
  }

  async listConversationIdsForUser(userId: string): Promise<string[]> {
    await this.syncRoomsForUser(userId);
    const rows = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    return rows.map((row) => row.conversationId);
  }

  async assertUserInConversation(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
  }

  private aggregateReceiptStatus(
    receipts: { deliveredAt: Date | null; readAt: Date | null }[],
  ): ChatReceiptStatus {
    if (receipts.length === 0) return ChatReceiptStatus.SENT;
    if (receipts.every((row) => row.readAt)) return ChatReceiptStatus.READ;
    if (receipts.every((row) => row.deliveredAt)) return ChatReceiptStatus.DELIVERED;
    return ChatReceiptStatus.SENT;
  }

  private async getMessageReceiptStatus(messageId: string): Promise<ChatReceiptStatus> {
    const receipts = await this.prisma.chatMessageReceipt.findMany({
      where: { messageId },
      select: { deliveredAt: true, readAt: true },
    });
    return this.aggregateReceiptStatus(receipts);
  }

  private conversationTitle(
    conversation: {
      type: string;
      title: string | null;
      zone: { name: string } | null;
      state: { name: string } | null;
    },
    peerName: string | null,
  ): string {
    if (conversation.type === "DIRECT") {
      return peerName ?? conversation.title ?? "Direct message";
    }
    if (conversation.type === "ZONE") {
      return conversation.zone ? `${conversation.zone.name} · Zone` : "Zone chat";
    }
    return conversation.state ? `${conversation.state.name} · State` : "State chat";
  }

  private async assertCanMessage(user: AuthUser) {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException("Inactive users cannot send messages");
    }
    if (!MESSAGING_ROLES.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const row = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!row) {
      throw new ForbiddenException("You are not in this conversation");
    }
  }

  private async syncRoomsForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { branch: true, zone: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE) return;

    if (user.role === Role.BRANCH_PASTOR && user.branch) {
      if (user.branch.zoneId) {
        await this.ensureZoneConversation(user.branch.zoneId);
      } else if (user.branch.stateId) {
        await this.ensureStateConversation(user.branch.stateId);
      }
    }

    if (user.role === Role.ZONAL_PASTOR && user.zoneId) {
      await this.ensureZoneConversation(user.zoneId);
      const zone = user.zone ?? (await this.prisma.zone.findUnique({ where: { id: user.zoneId } }));
      if (zone?.stateId) {
        await this.ensureStateConversation(zone.stateId);
      }
    }

    if (user.role === Role.STATE_PASTOR && user.stateId) {
      await this.ensureStateConversation(user.stateId);
    }
  }

  private async ensureZoneConversation(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) return;

    let conversation = await this.prisma.conversation.findUnique({ where: { zoneId } });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          type: ConversationType.ZONE,
          zoneId,
          title: `${zone.name} · Zone`,
        },
      });
    }

    const memberIds = await this.getZoneMemberUserIds(zoneId);
    await this.syncParticipants(conversation.id, memberIds);
  }

  private async ensureStateConversation(stateId: string) {
    const state = await this.prisma.state.findUnique({ where: { id: stateId } });
    if (!state) return;

    let conversation = await this.prisma.conversation.findUnique({ where: { stateId } });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          type: ConversationType.STATE,
          stateId,
          title: `${state.name} · State`,
        },
      });
    }

    const memberIds = await this.getStateMemberUserIds(stateId);
    await this.syncParticipants(conversation.id, memberIds);
  }

  private async getZoneMemberUserIds(zoneId: string): Promise<string[]> {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) return [];

    const pastors = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        OR: [
          { role: Role.ZONAL_PASTOR, zoneId },
          { role: Role.BRANCH_PASTOR, branch: { zoneId } },
        ],
      },
      select: { id: true },
    });

    const ids = new Set(pastors.map((p) => p.id));
    if (zone.zonalPastorId) ids.add(zone.zonalPastorId);
    return [...ids];
  }

  private async getStateMemberUserIds(stateId: string): Promise<string[]> {
    const state = await this.prisma.state.findUnique({ where: { id: stateId } });
    if (!state) return [];

    const pastors = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        OR: [
          { role: Role.STATE_PASTOR, stateId },
          { role: Role.ZONAL_PASTOR, zone: { stateId } },
          { role: Role.BRANCH_PASTOR, branch: { stateId, zoneId: null } },
        ],
      },
      select: { id: true },
    });

    const ids = new Set(pastors.map((p) => p.id));
    if (state.statePastorId) ids.add(state.statePastorId);
    return [...ids];
  }

  private async syncParticipants(conversationId: string, userIds: string[]) {
    const target = new Set(userIds);
    const existing = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
    });

    const toAdd = userIds.filter(
      (userId) => !existing.some((row) => row.userId === userId),
    );
    const toRemove = existing.filter((row) => !target.has(row.userId));

    if (toAdd.length > 0) {
      await this.prisma.conversationParticipant.createMany({
        data: toAdd.map((userId) => ({ conversationId, userId })),
        skipDuplicates: true,
      });
    }
    if (toRemove.length > 0) {
      await this.prisma.conversationParticipant.deleteMany({
        where: { id: { in: toRemove.map((row) => row.id) } },
      });
    }
  }
}
