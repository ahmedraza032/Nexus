import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CalendarDays, Clock, MapPin, MessageSquare, Plus, X, Check, XCircle,
  Ban, User, Loader2, ChevronLeft, ChevronRight, Video, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getMeetings,
  scheduleMeeting,
  acceptMeeting,
  rejectMeeting,
  cancelMeeting,
  deleteMeeting,
} from '../../api/meetingApi';
import { getMyConnections } from '../../api/connectionApi';
import { Meeting, MeetingStatus, CalendarEvent, Connection } from '../../types';

const localizer = momentLocalizer(moment);

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: MeetingStatus }> = ({ status }) => {
  const cfg: Record<MeetingStatus, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    accepted: { label: 'Accepted', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    rejected: { label: 'Rejected', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    cancelled: { label: 'Cancelled', cls: 'bg-slate-500/20 text-slate-400 border-slate-500/40' },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
};

// ─── Event color by status ────────────────────────────────────────────────────
const eventStyleGetter = (event: CalendarEvent) => {
  const colors: Record<MeetingStatus, string> = {
    pending: '#f59e0b',
    accepted: '#10b981',
    rejected: '#f43f5e',
    cancelled: '#64748b',
  };
  const bg = colors[event.resource.status] ?? '#6366f1';
  return {
    style: {
      backgroundColor: bg + '33',
      border: `1px solid ${bg}`,
      color: bg,
      borderRadius: '6px',
      fontWeight: 600,
      fontSize: '12px',
    },
  };
};

// ─── Schedule Modal ───────────────────────────────────────────────────────────
interface ScheduleModalProps {
  onClose: () => void;
  onCreated: () => void;
  prefillStart?: Date;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ onClose, onCreated, prefillStart }) => {
  const { user: currentUser } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [form, setForm] = useState({
    title: '',
    attendeeId: '',
    startTime: prefillStart ? format(prefillStart, "yyyy-MM-dd'T'HH:mm") : '',
    endTime: prefillStart
      ? format(new Date(prefillStart.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")
      : '',
    message: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show accepted connections as selectable participants
    getMyConnections('accepted').then(setConnections).catch(() => {});
  }, [currentUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.attendeeId || !form.startTime || !form.endTime) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await scheduleMeeting({
        title: form.title,
        attendeeId: form.attendeeId,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        message: form.message || undefined,
        location: form.location || undefined,
      });
      toast.success('Meeting request sent!');
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to schedule meeting';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f1629] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Schedule Meeting</h2>
              <p className="text-xs text-slate-400">Send a meeting request</p>
            </div>
          </div>
          <button
            id="schedule-modal-close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
            <input
              id="meeting-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Investment Discussion"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Participant *</label>
            <select
              id="meeting-attendee"
              required
              value={form.attendeeId}
              onChange={(e) => setForm({ ...form, attendeeId: e.target.value })}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
            >
              <option value="">Select a connection...</option>
              {connections.length === 0 && (
                <option disabled value="">No accepted connections yet</option>
              )}
              {connections.map((conn) => {
                const other =
                  (conn.requester as any)._id?.toString() === currentUser?.id
                    ? conn.recipient
                    : conn.requester;
                const otherId = (other as any)._id?.toString() ?? other._id;
                return (
                  <option key={conn._id} value={otherId}>
                    {other.name} ({other.role})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Start *</label>
              <input
                id="meeting-start"
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">End *</label>
              <input
                id="meeting-end"
                type="datetime-local"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <MapPin className="inline w-3.5 h-3.5 mr-1" />Location / Meeting Link
            </label>
            <input
              id="meeting-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Zoom link or office address"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <MessageSquare className="inline w-3.5 h-3.5 mr-1" />Message (optional)
            </label>
            <textarea
              id="meeting-message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={2}
              placeholder="Add a note to the invite..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              id="schedule-submit"
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Meeting Detail Panel ─────────────────────────────────────────────────────
interface DetailPanelProps {
  meeting: Meeting;
  currentUserId: string;
  onClose: () => void;
  onRefresh: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ meeting, currentUserId, onClose, onRefresh }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const isOrganizer = meeting.organizer._id === currentUserId;
  const isAttendee = meeting.attendee._id === currentUserId;

  const action = async (fn: () => Promise<unknown>, successMsg: string) => {
    setLoading(successMsg);
    try {
      await fn();
      toast.success(successMsg);
      onRefresh();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed';
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const other = isOrganizer ? meeting.attendee : meeting.organizer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f1629] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between mb-3">
            <StatusBadge status={meeting.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-white mt-2">{meeting.title}</h2>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Participant */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <img
              src={other.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=random`}
              alt={other.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-white">{other.name}</p>
              <p className="text-xs text-slate-400 capitalize">{other.role} · {isOrganizer ? 'Attendee' : 'Organizer'}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3 text-sm">
            <Clock className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">{format(new Date(meeting.startTime), 'EEEE, MMMM d, yyyy')}</p>
              <p className="text-slate-400">
                {format(new Date(meeting.startTime), 'h:mm a')} – {format(new Date(meeting.endTime), 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Location */}
          {meeting.location && (
            <div className="flex items-start gap-3 text-sm">
              {meeting.location.startsWith('http') ? (
                <Video className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-slate-300">{meeting.location}</span>
            </div>
          )}

          {/* Message */}
          {meeting.message && (
            <div className="flex items-start gap-3 text-sm">
              <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-slate-300 italic">"{meeting.message}"</p>
            </div>
          )}

          {/* Organizer tag */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <User className="w-3.5 h-3.5" />
            <span>Organized by <span className="text-slate-300">{meeting.organizer.name}</span></span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-wrap gap-2">
          {/* Attendee can accept/reject pending */}
          {isAttendee && meeting.status === 'pending' && (
            <>
              <button
                id={`accept-meeting-${meeting._id}`}
                onClick={() => action(() => acceptMeeting(meeting._id), 'Meeting accepted!')}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-60"
              >
                {loading === 'Meeting accepted!' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Accept
              </button>
              <button
                id={`reject-meeting-${meeting._id}`}
                onClick={() => action(() => rejectMeeting(meeting._id), 'Meeting rejected')}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-sm font-medium transition disabled:opacity-60"
              >
                {loading === 'Meeting rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Decline
              </button>
            </>
          )}

          {/* Organizer can cancel pending/accepted */}
          {isOrganizer && (meeting.status === 'pending' || meeting.status === 'accepted') && (
            <button
              id={`cancel-meeting-${meeting._id}`}
              onClick={() => action(() => cancelMeeting(meeting._id), 'Meeting cancelled')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-600/20 hover:bg-slate-600/40 border border-slate-500/40 text-slate-300 text-sm font-medium transition disabled:opacity-60"
            >
              {loading === 'Meeting cancelled' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Cancel Meeting
            </button>
          )}

          {/* Either party can delete cancelled/rejected */}
          {(meeting.status === 'cancelled' || meeting.status === 'rejected') && (
            <button
              id={`delete-meeting-${meeting._id}`}
              onClick={() => action(() => deleteMeeting(meeting._id), 'Meeting removed')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-sm font-medium transition disabled:opacity-60"
            >
              {loading === 'Meeting removed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar Meeting Card ─────────────────────────────────────────────────────
interface MeetingCardProps {
  meeting: Meeting;
  currentUserId: string;
  onClick: () => void;
}
const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, currentUserId, onClick }) => {
  const other = meeting.organizer._id === currentUserId ? meeting.attendee : meeting.organizer;
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/5 transition-all group"
    >
      <div className="flex items-start gap-3">
        <img
          src={other.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=random`}
          alt={other.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
            {meeting.title}
          </p>
          <p className="text-xs text-slate-400 truncate">{other.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-500">{format(new Date(meeting.startTime), 'MMM d, h:mm a')}</span>
          </div>
        </div>
        <StatusBadge status={meeting.status} />
      </div>
    </button>
  );
};

// ─── Toolbar ──────────────────────────────────────────────────────────────────
interface ToolbarProps {
  label: string;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: View) => void;
  view: View;
}
const CustomToolbar: React.FC<ToolbarProps> = ({ label, onNavigate, onView, view }) => {
  const views: View[] = ['month', 'week', 'day', 'agenda'];
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="text-white font-semibold ml-1">{label}</span>
      </div>
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
        {views.map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition capitalize ${
              view === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [prefillStart, setPrefillStart] = useState<Date | undefined>();
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [filter, setFilter] = useState<'all' | MeetingStatus>('all');

  const fetchMeetings = useCallback(async () => {
    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Convert meetings → react-big-calendar events
  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      meetings
        .filter((m) => m.status !== 'rejected' && m.status !== 'cancelled')
        .map((m) => ({
          id: m._id,
          title: m.title,
          start: new Date(m.startTime),
          end: new Date(m.endTime),
          resource: m,
        })),
    [meetings]
  );

  const filteredList = useMemo(
    () => (filter === 'all' ? meetings : meetings.filter((m) => m.status === filter)),
    [meetings, filter]
  );

  // Counts
  const pendingCount = meetings.filter((m) => m.status === 'pending').length;

  const handleSlotSelect = ({ start }: { start: Date }) => {
    setPrefillStart(start);
    setShowSchedule(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6 max-w-screen-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
            Meetings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Schedule and manage your business meetings</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">{pendingCount} pending</span>
            </div>
          )}
          <button
            id="open-schedule-modal"
            onClick={() => { setPrefillStart(undefined); setShowSchedule(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Calendar */}
        <div className="flex-1 bg-[#0a0f1e] border border-white/5 rounded-2xl p-5 overflow-hidden min-h-[600px]">
          <style>{`
            .rbc-calendar { color: #cbd5e1; font-family: inherit; }
            .rbc-header { border-color: rgba(255,255,255,0.06) !important; color: #64748b; font-size: 12px; font-weight: 600; padding: 8px 0; text-transform: uppercase; letter-spacing: 0.05em; }
            .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: none !important; background: transparent; }
            .rbc-day-bg { border-color: rgba(255,255,255,0.04) !important; }
            .rbc-off-range-bg { background: rgba(255,255,255,0.015) !important; }
            .rbc-today { background: rgba(99,102,241,0.06) !important; }
            .rbc-date-cell { color: #94a3b8; font-size: 12px; }
            .rbc-date-cell.rbc-now { color: #818cf8; font-weight: 700; }
            .rbc-show-more { color: #818cf8; font-size: 11px; background: transparent; }
            .rbc-toolbar { display: none; }
            .rbc-time-slot { border-color: rgba(255,255,255,0.04) !important; }
            .rbc-time-content { border-color: rgba(255,255,255,0.06) !important; }
            .rbc-time-header { border-color: rgba(255,255,255,0.06) !important; }
            .rbc-time-gutter .rbc-timeslot-group { border-color: rgba(255,255,255,0.04) !important; }
            .rbc-current-time-indicator { background: #6366f1 !important; }
            .rbc-label { color: #475569; font-size: 11px; }
            .rbc-agenda-table { border-color: rgba(255,255,255,0.06) !important; }
            .rbc-agenda-date-cell, .rbc-agenda-time-cell { color: #64748b; font-size: 12px; }
            .rbc-agenda-event-cell { color: #e2e8f0; }
            .rbc-row-content { background: transparent; }
            .rbc-month-row { border-color: rgba(255,255,255,0.04) !important; }
            .rbc-event:focus { outline: none; }
            .rbc-selected { background: inherit !important; }
            .rbc-slot-selection { background: rgba(99,102,241,0.15) !important; border: 1px solid rgba(99,102,241,0.4) !important; border-radius: 4px; }
          `}</style>
          <CustomToolbar
            label={moment(date).format(view === 'month' ? 'MMMM YYYY' : view === 'week' ? 'MMM D – ' + moment(date).endOf('week').format('MMM D, YYYY') : 'MMMM D, YYYY')}
            onNavigate={(action) => {
              if (action === 'TODAY') setDate(new Date());
              else if (action === 'PREV') setDate((d) => moment(d).subtract(1, view as moment.unitOfTime.DurationConstructor).toDate());
              else setDate((d) => moment(d).add(1, view as moment.unitOfTime.DurationConstructor).toDate());
            }}
            onView={setView}
            view={view}
          />
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            selectable
            onSelectSlot={handleSlotSelect}
            onSelectEvent={(event: CalendarEvent) => setSelectedMeeting(event.resource)}
            eventPropGetter={eventStyleGetter}
            style={{ height: 'calc(100% - 52px)' }}
            popup
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          {/* Filter tabs */}
          <div className="bg-[#0a0f1e] border border-white/5 rounded-2xl p-4">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(['all', 'pending', 'accepted', 'rejected', 'cancelled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition ${
                    filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5 scrollbar-thin">
              {filteredList.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No meetings found</p>
                </div>
              ) : (
                filteredList.map((m) => (
                  <MeetingCard
                    key={m._id}
                    meeting={m}
                    currentUserId={user?.id ?? ''}
                    onClick={() => setSelectedMeeting(m)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-[#0a0f1e] border border-white/5 rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Legend</p>
            <div className="space-y-2">
              {[
                { status: 'pending' as MeetingStatus, color: '#f59e0b', label: 'Pending invite' },
                { status: 'accepted' as MeetingStatus, color: '#10b981', label: 'Confirmed' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color + '55', border: `1px solid ${color}` }} />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSchedule && (
        <ScheduleModal
          onClose={() => setShowSchedule(false)}
          onCreated={fetchMeetings}
          prefillStart={prefillStart}
        />
      )}
      {selectedMeeting && (
        <DetailPanel
          meeting={selectedMeeting}
          currentUserId={user?.id ?? ''}
          onClose={() => setSelectedMeeting(null)}
          onRefresh={fetchMeetings}
        />
      )}
    </div>
  );
};
