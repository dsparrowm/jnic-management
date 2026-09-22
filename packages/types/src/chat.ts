export enum ConversationType {
  DIRECT = "DIRECT",
  ZONE = "ZONE",
  STATE = "STATE",
}

/** Aggregate receipt status shown to the sender (WhatsApp-style). */
export enum ChatReceiptStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
}

export type ChatParticipantPreview = {
  id: string;
  name: string;
  profilePicUrl: string | null;
  role: string;
};

export type ChatMessagePreview = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  /** Present when the viewer sent this last message. */
  receiptStatus: ChatReceiptStatus | null;
};

export type ConversationListItem = {
  id: string;
  type: ConversationType;
  title: string;
  lastMessage: ChatMessagePreview | null;
  unreadCount: number;
  updatedAt: string;
  peer: ChatParticipantPreview | null;
};

export type ChatInboxResponse = {
  items: ConversationListItem[];
  unreadCount: number;
};

export type ChatMessageRecord = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  senderProfilePicUrl: string | null;
  createdAt: string;
  mine: boolean;
  /** Present for the sender's own messages. */
  receiptStatus: ChatReceiptStatus | null;
};

export type ChatMessagesResponse = {
  items: ChatMessageRecord[];
  conversation: {
    id: string;
    type: ConversationType;
    title: string;
    /** Other participant in a direct chat; null for group rooms. */
    peer: ChatParticipantPreview | null;
  };
};

export type ChatReceiptUpdate = {
  conversationId: string;
  messageId: string;
  status: ChatReceiptStatus;
};
