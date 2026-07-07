import { Response } from 'express';
import { Types } from 'mongoose';
import { Connection } from '../models/Connection';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pushNotification = async (
  userId: Types.ObjectId | string,
  senderName: string,
  senderAvatar: string,
  content: string
): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $push: {
      notifications: {
        $each: [
          {
            type: 'connection',
            user: { name: senderName, avatar: senderAvatar },
            content,
            time: new Date().toISOString(),
            unread: true,
          },
        ],
        $position: 0,
      },
    },
  });
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc    Send a connection request (cross-role only: investor ↔ entrepreneur)
// @route   POST /api/connections
// @access  Private
export const sendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user!._id;
    const { recipientId, message } = req.body;

    if (!recipientId) {
      res.status(400).json({ message: 'recipientId is required' });
      return;
    }

    if (requesterId.toString() === recipientId.toString()) {
      res.status(400).json({ message: 'You cannot connect with yourself' });
      return;
    }

    // Verify the recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Enforce cross-role rule: investor ↔ entrepreneur only
    const requesterRole = req.user!.role;
    const recipientRole = recipient.role;

    if (requesterRole === recipientRole) {
      res.status(400).json({
        message: `Connections can only be made between investors and entrepreneurs, not between two ${requesterRole}s`,
      });
      return;
    }

    // Check if a connection already exists in either direction
    const existing = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        res.status(409).json({ message: 'You are already connected with this user' });
      } else if (existing.status === 'pending') {
        res.status(409).json({ message: 'A connection request already exists between you and this user' });
      } else {
        // If previously rejected, allow re-request by updating it
        existing.status = 'pending';
        existing.requester = requesterId as Types.ObjectId;
        existing.recipient = new Types.ObjectId(recipientId);
        existing.message = message;
        await existing.save();
        const populated = await existing.populate([
          { path: 'requester', select: 'name avatarUrl email role' },
          { path: 'recipient', select: 'name avatarUrl email role' },
        ]);
        await pushNotification(
          recipientId,
          req.user!.name,
          req.user!.avatarUrl || '',
          `${req.user!.name} sent you a connection request`
        );
        res.status(201).json(populated);
      }
      return;
    }

    const connection = await Connection.create({
      requester: requesterId,
      recipient: recipientId,
      message,
    });

    const populated = await connection.populate([
      { path: 'requester', select: 'name avatarUrl email role' },
      { path: 'recipient', select: 'name avatarUrl email role' },
    ]);

    // Notify the recipient
    await pushNotification(
      recipientId,
      req.user!.name,
      req.user!.avatarUrl || '',
      `${req.user!.name} sent you a connection request`
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Accept or reject a connection request (recipient only)
// @route   PUT /api/connections/:id
// @access  Private
export const respondToRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action } = req.body; // 'accepted' | 'rejected'

    if (!['accepted', 'rejected'].includes(action)) {
      res.status(400).json({ message: "action must be 'accepted' or 'rejected'" });
      return;
    }

    const connection = await Connection.findById(req.params.id)
      .populate('requester', 'name avatarUrl email role')
      .populate('recipient', 'name avatarUrl email role');

    if (!connection) {
      res.status(404).json({ message: 'Connection request not found' });
      return;
    }

    // Only the recipient can respond
    if (connection.recipient._id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only the recipient can respond to this request' });
      return;
    }

    if (connection.status !== 'pending') {
      res.status(400).json({ message: `Request is already ${connection.status}` });
      return;
    }

    connection.status = action;
    await connection.save();

    // Notify the requester
    const verb = action === 'accepted' ? 'accepted' : 'declined';
    await pushNotification(
      connection.requester._id,
      req.user!.name,
      req.user!.avatarUrl || '',
      `${req.user!.name} ${verb} your connection request`
    );

    res.status(200).json(connection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Disconnect from a user (remove accepted connection)
// @route   DELETE /api/connections/:id
// @access  Private
export const disconnect = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      res.status(404).json({ message: 'Connection not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isParticipant =
      connection.requester.toString() === userId || connection.recipient.toString() === userId;

    if (!isParticipant) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    await Connection.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get all connections for the current user
// @route   GET /api/connections
// @access  Private
export const getMyConnections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status } = req.query;

    const query: Record<string, unknown> = {
      $or: [{ requester: userId }, { recipient: userId }],
    };
    if (status) query.status = status;

    const connections = await Connection.find(query)
      .populate('requester', 'name avatarUrl email role isOnline startupName investmentInterests')
      .populate('recipient', 'name avatarUrl email role isOnline startupName investmentInterests')
      .sort({ updatedAt: -1 });

    res.status(200).json(connections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get connection status between current user and a specific user
// @route   GET /api/connections/status/:userId
// @access  Private
export const getConnectionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const myId = req.user!._id;
    const { userId } = req.params;

    const connection = await Connection.findOne({
      $or: [
        { requester: myId, recipient: userId },
        { requester: userId, recipient: myId },
      ],
    });

    if (!connection) {
      res.status(200).json({ status: 'none', connectionId: null });
      return;
    }

    // Determine if I am the requester or recipient to give correct pending direction
    const iAmRequester = connection.requester.toString() === myId.toString();
    let clientStatus: string = connection.status;

    if (connection.status === 'pending') {
      clientStatus = iAmRequester ? 'pending_sent' : 'pending_received';
    }

    res.status(200).json({
      status: clientStatus,
      connectionId: connection._id,
      connection,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
