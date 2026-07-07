import { Response } from 'express';
import { Types } from 'mongoose';
import { Meeting } from '../models/Meeting';
import { User } from '../models/User';
import { Connection } from '../models/Connection';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Checks whether a proposed [newStart, newEnd] window conflicts with any
 * already-accepted meeting involving the given userId (as organizer OR attendee).
 * Overlap condition: existingStart < newEnd AND existingEnd > newStart
 */
const hasConflict = async (
  userId: Types.ObjectId | string,
  newStart: Date,
  newEnd: Date,
  excludeMeetingId?: string
): Promise<boolean> => {
  const query: Record<string, unknown> = {
    status: 'accepted',
    startTime: { $lt: newEnd },
    endTime: { $gt: newStart },
    $or: [{ organizer: userId }, { attendee: userId }],
  };

  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }

  const conflict = await Meeting.findOne(query);
  return conflict !== null;
};

/**
 * Push a notification to a user's notifications array.
 */
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
            type: 'meeting',
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

// @desc    Schedule a new meeting
// @route   POST /api/meetings
// @access  Private
export const scheduleMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, attendeeId, startTime, endTime, message, location } = req.body;
    const organizerId = req.user!._id as Types.ObjectId;

    // Basic validation
    if (!title || !attendeeId || !startTime || !endTime) {
      res.status(400).json({ message: 'title, attendeeId, startTime, and endTime are required' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      res.status(400).json({ message: 'endTime must be after startTime' });
      return;
    }

    if (start < new Date()) {
      res.status(400).json({ message: 'Cannot schedule meetings in the past' });
      return;
    }

    // Verify attendee exists
    const attendee = await User.findById(attendeeId);
    if (!attendee) {
      res.status(404).json({ message: 'Attendee user not found' });
      return;
    }

    // Cannot schedule a meeting with yourself
    if (organizerId.toString() === attendeeId.toString()) {
      res.status(400).json({ message: 'Cannot schedule a meeting with yourself' });
      return;
    }

    // Connection guard — both users must be accepted connections
    const connection = await Connection.findOne({
      $or: [
        { requester: organizerId, recipient: attendeeId },
        { requester: attendeeId, recipient: organizerId },
      ],
      status: 'accepted',
    });
    if (!connection) {
      res.status(403).json({ message: 'You must be connected with this user before scheduling a meeting' });
      return;
    }

    // Conflict detection — check both participants
    const organizerConflict = await hasConflict(organizerId, start, end);
    if (organizerConflict) {
      res.status(409).json({ message: 'You already have an accepted meeting during this time slot' });
      return;
    }

    const attendeeConflict = await hasConflict(attendeeId, start, end);
    if (attendeeConflict) {
      res.status(409).json({ message: 'The other participant already has a meeting during this time slot' });
      return;
    }

    const meeting = await Meeting.create({
      title,
      organizer: organizerId,
      attendee: attendeeId,
      startTime: start,
      endTime: end,
      message,
      location,
      status: 'pending',
    });

    const populated = await meeting.populate([
      { path: 'organizer', select: 'name avatarUrl email role' },
      { path: 'attendee', select: 'name avatarUrl email role' },
    ]);

    // Notify the attendee about the new invite
    await pushNotification(
      attendeeId,
      req.user!.name,
      req.user!.avatarUrl || '',
      `${req.user!.name} has sent you a meeting request: "${title}"`
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get all meetings for the authenticated user
// @route   GET /api/meetings
// @access  Private
export const getMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status, from, to } = req.query;

    const query: Record<string, unknown> = {
      $or: [{ organizer: userId }, { attendee: userId }],
    };

    if (status) query.status = status;
    if (from || to) {
      query.startTime = {};
      if (from) (query.startTime as Record<string, unknown>).$gte = new Date(from as string);
      if (to) (query.startTime as Record<string, unknown>).$lte = new Date(to as string);
    }

    const meetings = await Meeting.find(query)
      .populate('organizer', 'name avatarUrl email role')
      .populate('attendee', 'name avatarUrl email role')
      .sort({ startTime: 1 });

    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get a single meeting by ID
// @route   GET /api/meetings/:id
// @access  Private
export const getMeetingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name avatarUrl email role')
      .populate('attendee', 'name avatarUrl email role');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isParticipant =
      meeting.organizer._id.toString() === userId || meeting.attendee._id.toString() === userId;

    if (!isParticipant) {
      res.status(403).json({ message: 'Not authorized to view this meeting' });
      return;
    }

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Accept a pending meeting (attendee only)
// @route   PUT /api/meetings/:id/accept
// @access  Private
export const acceptMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name avatarUrl email role')
      .populate('attendee', 'name avatarUrl email role');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    if (meeting.attendee._id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only the invited attendee can accept this meeting' });
      return;
    }

    if (meeting.status !== 'pending') {
      res.status(400).json({ message: `Cannot accept a meeting that is already ${meeting.status}` });
      return;
    }

    // Conflict detection before accepting
    const attendeeConflict = await hasConflict(req.user!._id, meeting.startTime, meeting.endTime, meeting._id.toString());
    if (attendeeConflict) {
      res.status(409).json({ message: 'You already have an accepted meeting during this time slot' });
      return;
    }

    meeting.status = 'accepted';
    await meeting.save();

    // Increment upcomingMeetings for both participants
    await User.findByIdAndUpdate(meeting.organizer._id, { $inc: { upcomingMeetings: 1 } });
    await User.findByIdAndUpdate(meeting.attendee._id, { $inc: { upcomingMeetings: 1 } });

    // Notify the organizer
    await pushNotification(
      meeting.organizer._id,
      req.user!.name,
      req.user!.avatarUrl || '',
      `${req.user!.name} accepted your meeting request: "${meeting.title}"`
    );

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Reject a pending meeting (attendee only)
// @route   PUT /api/meetings/:id/reject
// @access  Private
export const rejectMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name avatarUrl email role')
      .populate('attendee', 'name avatarUrl email role');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    if (meeting.attendee._id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only the invited attendee can reject this meeting' });
      return;
    }

    if (meeting.status !== 'pending') {
      res.status(400).json({ message: `Cannot reject a meeting that is already ${meeting.status}` });
      return;
    }

    meeting.status = 'rejected';
    await meeting.save();

    // Notify the organizer
    await pushNotification(
      meeting.organizer._id,
      req.user!.name,
      req.user!.avatarUrl || '',
      `${req.user!.name} declined your meeting request: "${meeting.title}"`
    );

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Cancel an accepted/pending meeting (organizer only)
// @route   PUT /api/meetings/:id/cancel
// @access  Private
export const cancelMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name avatarUrl email role')
      .populate('attendee', 'name avatarUrl email role');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    if (meeting.organizer._id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only the organizer can cancel this meeting' });
      return;
    }

    if (meeting.status === 'cancelled') {
      res.status(400).json({ message: 'Meeting is already cancelled' });
      return;
    }

    const wasAccepted = meeting.status === 'accepted';
    meeting.status = 'cancelled';
    await meeting.save();

    // Decrement counters if it was accepted
    if (wasAccepted) {
      await User.findByIdAndUpdate(meeting.organizer._id, { $inc: { upcomingMeetings: -1 } });
      await User.findByIdAndUpdate(meeting.attendee._id, { $inc: { upcomingMeetings: -1 } });
    }

    // Notify the attendee
    await pushNotification(
      meeting.attendee._id,
      req.user!.name,
      req.user!.avatarUrl || '',
      `${req.user!.name} cancelled the meeting: "${meeting.title}"`
    );

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Update meeting details (organizer only, pending meetings only)
// @route   PUT /api/meetings/:id
// @access  Private
export const updateMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name avatarUrl email role')
      .populate('attendee', 'name avatarUrl email role');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    if (meeting.organizer._id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only the organizer can update this meeting' });
      return;
    }

    if (meeting.status !== 'pending') {
      res.status(400).json({ message: 'Only pending meetings can be updated' });
      return;
    }

    const { title, startTime, endTime, message, location } = req.body;
    const newStart = startTime ? new Date(startTime) : meeting.startTime;
    const newEnd = endTime ? new Date(endTime) : meeting.endTime;

    if (newStart >= newEnd) {
      res.status(400).json({ message: 'endTime must be after startTime' });
      return;
    }

    // Conflict check if times changed
    if (startTime || endTime) {
      const organizerConflict = await hasConflict(req.user!._id, newStart, newEnd, meeting._id.toString());
      if (organizerConflict) {
        res.status(409).json({ message: 'You already have an accepted meeting during this time slot' });
        return;
      }
      const attendeeConflict = await hasConflict(meeting.attendee._id, newStart, newEnd, meeting._id.toString());
      if (attendeeConflict) {
        res.status(409).json({ message: 'The other participant already has a meeting during this time slot' });
        return;
      }
    }

    if (title) meeting.title = title;
    if (startTime) meeting.startTime = newStart;
    if (endTime) meeting.endTime = newEnd;
    if (message !== undefined) meeting.message = message;
    if (location !== undefined) meeting.location = location;

    await meeting.save();

    // Notify attendee of the update
    await pushNotification(
      meeting.attendee._id,
      req.user!.name,
      req.user!.avatarUrl || '',
      `${req.user!.name} updated the meeting details: "${meeting.title}"`
    );

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Delete a cancelled meeting
// @route   DELETE /api/meetings/:id
// @access  Private
export const deleteMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isParticipant =
      meeting.organizer.toString() === userId || meeting.attendee.toString() === userId;

    if (!isParticipant) {
      res.status(403).json({ message: 'Not authorized to delete this meeting' });
      return;
    }

    if (meeting.status !== 'cancelled' && meeting.status !== 'rejected') {
      res.status(400).json({ message: 'Only cancelled or rejected meetings can be deleted' });
      return;
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
