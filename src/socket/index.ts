import { Server, Socket } from 'socket.io';
import { verifyAccessToken, TokenPayload } from '../utils/generateTokens';
import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';

const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  const decoded = verifyAccessToken(token);
  if (!decoded) return next(new Error('Invalid token'));
  socket.data.user = decoded;
  next();
};

export const initializeSocketServer = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }
  });
  io.use(socketAuthMiddleware);

  const onlineUsers = new Map<string, string>(); // userId -> socketId

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.userId;
    onlineUsers.set(userId, socket.id);
    socket.join(userId); // personal room

    // --- Send message (one-to-one or group) ---
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, receiverId, isGroup } = data;
        const db = getDb();
        let targetConversationId = conversationId;

        if (!targetConversationId && !isGroup) {
          // Find or create one-to-one conversation
          const existing = await db.collection('conversations').findOne({
            participants: { $all: [new ObjectId(userId), new ObjectId(receiverId)], $size: 2 },
            isGroup: false,
          });
          if (existing) {
            targetConversationId = existing._id.toString();
          } else {
            const result = await db.collection('conversations').insertOne({
              participants: [new ObjectId(userId), new ObjectId(receiverId)],
              isGroup: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            targetConversationId = result.insertedId.toString();
          }
        }

        const message = {
          conversationId: new ObjectId(targetConversationId),
          sender: new ObjectId(userId),
          content,
          readBy: [new ObjectId(userId)],
          createdAt: new Date(),
        };
        const inserted = await db.collection('messages').insertOne(message);
        const fullMessage = { ...message, _id: inserted.insertedId, sender: userId };

        await db.collection('conversations').updateOne(
          { _id: new ObjectId(targetConversationId) },
          { $set: { lastMessage: content, updatedAt: new Date() } }
        );

        if (isGroup) {
          socket.to(targetConversationId).emit('receive_message', fullMessage);
        } else {
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) io.to(receiverSocketId).emit('receive_message', fullMessage);
        }
        socket.emit('message_sent', fullMessage);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // --- Typing indicators ---
    socket.on('typing_start', ({ conversationId, receiverId, isGroup }) => {
      if (isGroup) socket.to(conversationId).emit('user_typing', { userId, conversationId });
      else {
        const target = onlineUsers.get(receiverId);
        if (target) io.to(target).emit('user_typing', { userId, conversationId });
      }
    });
    socket.on('typing_end', ({ conversationId, receiverId, isGroup }) => {
      if (isGroup) socket.to(conversationId).emit('user_stop_typing', { userId, conversationId });
      else {
        const target = onlineUsers.get(receiverId);
        if (target) io.to(target).emit('user_stop_typing', { userId, conversationId });
      }
    });

    // --- Read receipts ---
    socket.on('mark_read', async ({ messageId, conversationId }) => {
      const db = getDb();
      await db.collection('messages').updateOne(
        { _id: new ObjectId(messageId) },
        { $addToSet: { readBy: new ObjectId(userId) } }
      );
      // Notify sender if online
      const msg = await db.collection('messages').findOne({ _id: new ObjectId(messageId) });
      if (msg && msg.sender.toString() !== userId) {
        const senderSocket = onlineUsers.get(msg.sender.toString());
        if (senderSocket) io.to(senderSocket).emit('message_read', { messageId, userId });
      }
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user_status', { userId, status: 'offline' });
    });
  });
  return io;
};