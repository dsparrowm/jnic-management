import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthUser } from "../common/auth.types";
import { ChatService } from "./chat.service";
import {
  CreateDirectChatDto,
  ListChatMessagesDto,
  SendChatMessageDto,
} from "./dto/chat.dto";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("inbox")
  getInbox(@CurrentUser() user: AuthUser) {
    return this.chatService.getInbox(user);
  }

  @Get("unread-count")
  getUnreadCount(@CurrentUser() user: AuthUser) {
    return this.chatService.getUnreadCount(user.id);
  }

  @Post("direct")
  createDirect(@CurrentUser() user: AuthUser, @Body() dto: CreateDirectChatDto) {
    return this.chatService.createDirect(user, dto.userId);
  }

  @Get("conversations/:id/messages")
  getMessages(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Query() query: ListChatMessagesDto,
  ) {
    return this.chatService.getMessages(user, id, query);
  }

  @Post("conversations/:id/messages")
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatService.sendMessage(user, id, dto);
  }

  @Patch("conversations/:id/read")
  markRead(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.chatService.markRead(user.id, id);
  }
}
