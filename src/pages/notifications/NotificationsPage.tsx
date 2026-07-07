import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, UserPlus, DollarSign, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Connection } from '../../types';
import { getMyConnections, respondToRequest } from '../../api/connectionApi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const NotificationsPage: React.FC = () => {
  const { user, markNotificationsAsRead } = useAuth();
  const navigate = useNavigate();
  const notifications = user?.notifications || [];

  // Pending connection requests directed TO the current user
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([]);
  const [connLoading, setConnLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const loadPending = async () => {
    try {
      const all = await getMyConnections('pending');
      // Only those where I am the recipient (i.e. someone sent me a request)
      const incoming = all.filter(
        (c) => ((c.recipient as any)._id?.toString() ?? c.recipient._id) === user?.id
      );
      setPendingConnections(incoming);
    } catch {
      // silent
    } finally {
      setConnLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, [user?.id]);

  const handleRespond = async (connectionId: string, action: 'accepted' | 'rejected') => {
    setResponding(connectionId);
    try {
      await respondToRequest(connectionId, action);
      toast.success(action === 'accepted' ? 'Connection accepted!' : 'Request declined');
      await loadPending();
    } catch {
      toast.error('Action failed');
    } finally {
      setResponding(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={16} className="text-primary-600" />;
      case 'connection':
        return <UserPlus size={16} className="text-secondary-600" />;
      case 'meeting':
        return <Calendar size={16} className="text-accent-600" />;
      case 'investment':
        return <DollarSign size={16} className="text-accent-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your network activity</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={markNotificationsAsRead}
        >
          Mark all as read
        </Button>
      </div>

      {/* ── Pending Connection Requests ───────────────────────────────────── */}
      {!connLoading && pendingConnections.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <UserPlus size={18} className="text-secondary-600" />
            Connection Requests
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {pendingConnections.length} pending
            </span>
          </h2>

          {pendingConnections.map((conn) => {
            const requester = conn.requester;
            const requesterId = (requester as any)._id?.toString() ?? requester._id;
            const profilePath = `/profile/${requester.role}/${requesterId}`;

            return (
              <Card key={conn._id} className="border-l-4 border-l-secondary-400 bg-secondary-50/30">
                <CardBody className="p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={requester.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(requester.name)}&background=random`}
                      alt={requester.name}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{requester.name}</span>
                        <Badge variant="secondary" size="sm" rounded>
                          {requester.role}
                        </Badge>
                        <Badge variant="warning" size="sm" rounded>New</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        Sent you a connection request
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(conn.createdAt), { addSuffix: true })}
                      </p>
                      {conn.message && (
                        <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-1.5 italic border border-amber-100">
                          "{conn.message}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Button
                          size="sm"
                          leftIcon={responding === conn._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          disabled={!!responding}
                          onClick={() => handleRespond(conn._id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<XCircle size={14} />}
                          disabled={!!responding}
                          onClick={() => handleRespond(conn._id, 'rejected')}
                        >
                          Decline
                        </Button>
                        <Link to={profilePath}>
                          <Button variant="primary" size="sm">View Profile</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── General Notifications from user.notifications[] ──────────────── */}
      <div className="space-y-4">
        {notifications.length === 0 && pendingConnections.length === 0 && !connLoading && (
          <Card>
            <CardBody className="text-center py-12">
              <Bell size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications yet</p>
            </CardBody>
          </Card>
        )}

        {notifications
          .filter(n => !(n.type === 'connection' && n.content.includes('sent you a connection request')))
          .map((notification, index) => {
            let formattedTime = notification.time;
            try {
              if (notification.time) {
                formattedTime = formatDistanceToNow(new Date(notification.time), { addSuffix: true });
              }
            } catch (e) {
              // fallback to original string if invalid date
            }

            return (
              <Card
                key={notification.id || (notification as any)._id || index}
                className={`transition-colors duration-200 ${notification.unread ? 'bg-primary-50' : ''}`}
              >
                <CardBody className="flex items-start p-4">
                  <Avatar
                    src={notification.user.avatar}
                    alt={notification.user.name}
                    size="md"
                    className="flex-shrink-0 mr-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{notification.user.name}</span>
                      {notification.unread && (
                        <Badge variant="primary" size="sm" rounded>New</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{notification.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      {getNotificationIcon(notification.type)}
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
      </div>
    </div>
  );
};