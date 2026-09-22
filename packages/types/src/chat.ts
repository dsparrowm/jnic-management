export enum ConversationType {
  DIRECT = "DIRECT",
  ZONE = "ZONE",
  STATE = "STATE",
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
};

export type ChatMessagesResponse = {
  items: ChatMessageRecord[];
  conversation: {
    id: string;
    type: ConversationType;
    title: string;
  };
};
