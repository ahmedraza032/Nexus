import { Response } from 'express';
import { Types } from 'mongoose';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { Connection } from '../models/Connection';

// @desc    Get conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Aggregate unique conversation partners by getting the latest message per partner
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partner',
        },
      },
      {
        $unwind: '$partner',
      },
      {
        $project: {
          'partner.password': 0,
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    const formattedConversations = messages.map((m) => {
      const partnerId = m.partner._id.toString();
      const myId = userId.toString();
      return {
        id: `conv-${myId}-${partnerId}`,
        participants: [myId, partnerId],
        lastMessage: {
          id: m.lastMessage._id,
          senderId: m.lastMessage.senderId,
          receiverId: m.lastMessage.receiverId,
          content: m.lastMessage.content,
          timestamp: m.lastMessage.createdAt,
          isRead: m.lastMessage.isRead,
        },
        updatedAt: m.lastMessage.createdAt,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get messages between current user and a specific user
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = req.user!._id;
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    const formattedMessages = messages.map(m => ({
      id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      content: m.content,
      timestamp: m.createdAt,
      isRead: m.isRead
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = req.user!._id;
    const { userId } = req.params; // The partner whose messages I'm reading

    await Message.updateMany(
      { senderId: userId, receiverId: myId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Send message via REST (fallback/alternative to socket)
// @route   POST /api/messages
// @access  Private
export const sendMessageREST = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const senderId = req.user!._id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      res.status(400).json({ message: 'Receiver and content are required' });
      return;
    }

    // Verify connection status
    const connection = await Connection.findOne({
      $or: [
        { requester: senderId, recipient: receiverId },
        { requester: receiverId, recipient: senderId },
      ],
      status: 'accepted'
    });

    if (!connection) {
      res.status(403).json({ message: 'You must be connected to send messages' });
      return;
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content,
      isRead: false
    });

    const formattedMessage = {
      id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      timestamp: message.createdAt,
      isRead: message.isRead
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
