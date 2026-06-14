import { ObjectId } from "mongodb";

export interface IConversation {
  _id: ObjectId;
  participants: ObjectId[];
  isGroup: boolean;
  groupName?: string;
  groupAdmin?: ObjectId;
  lastMessage?: string;
  updatedAt: Date;
  createdAt: Date;
}

// src/models/MessageModel.ts
export interface IMessage {
  _id: ObjectId;
  conversationId: ObjectId;
  sender: ObjectId;
  content: string;
  readBy: ObjectId[];
  createdAt: Date;
}