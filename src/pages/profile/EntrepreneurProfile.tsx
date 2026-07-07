import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle, Users, Calendar, Building2, MapPin, UserCircle,
  FileText, DollarSign, Send, UserPlus, UserCheck, UserX, Clock,
  CheckCircle, XCircle, CalendarDays, Loader2,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Entrepreneur, Connection, ConnectionClientStatus } from '../../types';
import api from '../../api/axiosConfig';
import {
  sendConnectionRequest,
  respondToRequest,
  disconnect,
  getConnectionStatus,
  getMyConnections,
} from '../../api/connectionApi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Connect Button ───────────────────────────────────────────────────────────
interface ConnectButtonProps {
  status: ConnectionClientStatus;
  connectionId: string | null;
  onConnect: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onDisconnect: () => void;
  loading: boolean;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  status, connectionId, onConnect, onAccept, onDecline, onDisconnect, loading,
}) => {
  if (loading) {
    return (
      <Button disabled leftIcon={<Loader2 size={16} className="animate-spin" />}>
        Loading...
      </Button>
    );
  }

  switch (status) {
    case 'none':
      return (
        <Button id="connect-btn" onClick={onConnect} leftIcon={<UserPlus size={18} />}>
          Connect
        </Button>
      );
    case 'pending_sent':
      return (
        <Button id="pending-sent-btn" variant="outline" disabled leftIcon={<Clock size={18} />}>
          Request Sent
        </Button>
      );
    case 'pending_received':
      return (
        <div className="flex gap-2">
          <Button id="accept-connection-btn" onClick={onAccept} leftIcon={<CheckCircle size={18} />}>
            Accept
          </Button>
          <Button id="decline-connection-btn" variant="outline" onClick={onDecline} leftIcon={<XCircle size={18} />}>
            Decline
          </Button>
        </div>
      );
    case 'accepted':
      return (
        <Button
          id="disconnect-btn"
          variant="outline"
          onClick={onDisconnect}
          leftIcon={<UserCheck size={18} />}
        >
          Connected
        </Button>
      );
  }
};

// ─── Collaboration Requests Section ──────────────────────────────────────────
interface CollaborationSectionProps {
  profileId: string;
  isCurrentUser: boolean;
}

const CollaborationSection: React.FC<CollaborationSectionProps> = ({ profileId, isCurrentUser }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        // For current user's own profile: show all their connections
        // For other profile pages: only show accepted connections involving that profile
        const all = await getMyConnections();
        if (isCurrentUser) {
          setConnections(all);
        } else {
          // Show only the connection between the viewer and this profile
          const relevant = all.filter((c) => {
            const rId = (c.requester as any)._id ?? c.requester._id;
            const aId = (c.recipient as any)._id ?? c.recipient._id;
            return (
              rId?.toString() === profileId || aId?.toString() === profileId
            );
          });
          setConnections(relevant);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [profileId, isCurrentUser]);

  const handleRespond = async (connectionId: string, action: 'accepted' | 'rejected') => {
    try {
      await respondToRequest(connectionId, action);
      toast.success(action === 'accepted' ? 'Connection accepted!' : 'Connection declined');
      // refresh
      const all = await getMyConnections();
      setConnections(all.filter((c) => {
        const rId = (c.requester as any)._id ?? c.requester._id;
        const aId = (c.recipient as any)._id ?? c.recipient._id;
        return isCurrentUser || rId?.toString() === profileId || aId?.toString() === profileId;
      }));
    } catch {
      toast.error('Action failed');
    }
  };

  const pendingReceived = connections.filter(
    (c) => c.status === 'pending' &&
      ((c.recipient as any)._id ?? c.recipient._id)?.toString() === currentUser?.id
  );

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Collaboration Requests</h2>
        {pendingReceived.length > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            {pendingReceived.length} pending
          </span>
        )}
      </CardHeader>
      <CardBody>
        {connections.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No collaboration requests yet.</p>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => {
              const other =
                ((conn.requester as any)._id ?? conn.requester._id)?.toString() === currentUser?.id
                  ? conn.recipient
                  : conn.requester;
              const otherRole = other.role;
              const profilePath = `/${otherRole === 'entrepreneur' ? 'profile/entrepreneur' : 'profile/investor'}/${(other as any)._id ?? other._id}`;
              const isRecipient =
                ((conn.recipient as any)._id ?? conn.recipient._id)?.toString() === currentUser?.id;

              return (
                <div key={conn._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={other.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=random`}
                        alt={other.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{other.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conn.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {conn.status === 'accepted' && (
                      <span className="text-sm font-medium text-emerald-600">Accepted</span>
                    )}
                    {conn.status === 'rejected' && (
                      <span className="text-sm font-medium text-rose-500">Declined</span>
                    )}
                    {conn.status === 'pending' && isRecipient && (
                      <span className="text-sm font-medium text-amber-600">Pending</span>
                    )}
                    {conn.status === 'pending' && !isRecipient && (
                      <span className="text-sm font-medium text-gray-400">Sent</span>
                    )}
                  </div>

                  {conn.message && (
                    <p className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2 italic">
                      {conn.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex gap-2">
                      {conn.status === 'accepted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<MessageCircle size={14} />}
                          onClick={() => navigate(`/chat/${(other as any)._id ?? other._id}`)}
                        >
                          Message
                        </Button>
                      )}
                      {conn.status === 'pending' && isRecipient && (
                        <>
                          <Button
                            size="sm"
                            leftIcon={<CheckCircle size={14} />}
                            onClick={() => handleRespond(conn._id, 'accepted')}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<XCircle size={14} />}
                            onClick={() => handleRespond(conn._id, 'rejected')}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                    <Link to={profilePath}>
                      <Button variant="primary" size="sm">View Profile</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection state
  const [connStatus, setConnStatus] = useState<ConnectionClientStatus>('none');
  const [connId, setConnId] = useState<string | null>(null);
  const [connLoading, setConnLoading] = useState(false);
  const [connCheckDone, setConnCheckDone] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/profiles/${id}`);
        const data = response.data;
        if (data._id && !data.id) data.id = data._id;
        if (data.role === 'entrepreneur') {
          setEntrepreneur(data as Entrepreneur);
        } else {
          setError('This profile is not an entrepreneur.');
        }
      } catch (err: any) {
        setError(`Entrepreneur not found. (${err.response?.data?.message || err.message})`);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  // Check connection status once profile is loaded and it's not the current user
  useEffect(() => {
    if (!id || !currentUser) return;
    const isCurrentUser = currentUser.id === id;
    if (isCurrentUser) { setConnCheckDone(true); return; }

    getConnectionStatus(id)
      .then((res) => {
        setConnStatus(res.status);
        setConnId(res.connectionId);
      })
      .catch(() => {})
      .finally(() => setConnCheckDone(true));
  }, [id, currentUser]);

  const handleConnect = async () => {
    setConnLoading(true);
    try {
      const conn = await sendConnectionRequest(id!);
      setConnStatus('pending_sent');
      setConnId(conn._id);
      toast.success('Connection request sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to send request');
    } finally {
      setConnLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!connId) return;
    setConnLoading(true);
    try {
      await respondToRequest(connId, 'accepted');
      setConnStatus('accepted');
      toast.success('Connection accepted!');
    } catch {
      toast.error('Action failed');
    } finally {
      setConnLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!connId) return;
    setConnLoading(true);
    try {
      await respondToRequest(connId, 'rejected');
      setConnStatus('none');
      setConnId(null);
      toast.success('Request declined');
    } catch {
      toast.error('Action failed');
    } finally {
      setConnLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connId) return;
    setConnLoading(true);
    try {
      await disconnect(connId);
      setConnStatus('none');
      setConnId(null);
      toast.success('Disconnected');
    } catch {
      toast.error('Action failed');
    } finally {
      setConnLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error || !entrepreneur) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">The entrepreneur profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === entrepreneur.id || currentUser?.id === (entrepreneur as any)._id;
  const isConnected = connStatus === 'accepted';
  const isCrossRole = currentUser?.role !== entrepreneur.role;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">{entrepreneur.industry}</Badge>
                <Badge variant="gray">
                  <MapPin size={14} className="mr-1" />
                  {entrepreneur.location}
                </Badge>
                <Badge variant="accent">
                  <Calendar size={14} className="mr-1" />
                  Founded {entrepreneur.foundedYear}
                </Badge>
                <Badge variant="secondary">
                  <Users size={14} className="mr-1" />
                  {entrepreneur.teamSize} team members
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                {/* Message — only if connected */}
                {isConnected && (
                  <Link to={`/chat/${entrepreneur.id}`}>
                    <Button variant="outline" leftIcon={<MessageCircle size={18} />}>
                      Message
                    </Button>
                  </Link>
                )}

                {/* Schedule Meeting — only if connected */}
                {isConnected && (
                  <Button
                    variant="outline"
                    leftIcon={<CalendarDays size={18} />}
                    onClick={() => navigate('/meetings')}
                  >
                    Schedule Meeting
                  </Button>
                )}

                {/* Connect button — only for cross-role */}
                {isCrossRole && connCheckDone && (
                  <ConnectButton
                    status={connStatus}
                    connectionId={connId}
                    onConnect={handleConnect}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onDisconnect={handleDisconnect}
                    loading={connLoading}
                  />
                )}
              </>
            )}

            {isCurrentUser && (
              <Link to="/settings">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">{entrepreneur.bio}</p>
            </CardBody>
          </Card>

          {/* Startup Overview */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Startup Overview</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Problem Statement</h3>
                  <p className="text-gray-700 mt-1">{entrepreneur?.pitchSummary?.split('.')[0]}.</p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">Solution</h3>
                  <p className="text-gray-700 mt-1">{entrepreneur.pitchSummary}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">Market Opportunity</h3>
                  <p className="text-gray-700 mt-1">
                    The {entrepreneur.industry} market is experiencing significant growth, with a projected CAGR of 14.5% through 2027.
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">Competitive Advantage</h3>
                  <p className="text-gray-700 mt-1">
                    Unlike our competitors, we offer a unique approach combining innovative technology with deep industry expertise.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Team</h2>
              <span className="text-sm text-gray-500">{entrepreneur.teamSize} members</span>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar src={entrepreneur.avatarUrl} alt={entrepreneur.name} size="md" className="mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{entrepreneur.name}</h3>
                    <p className="text-xs text-gray-500">Founder & CEO</p>
                  </div>
                </div>
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar src="https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg" alt="Team Member" size="md" className="mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Alex Johnson</h3>
                    <p className="text-xs text-gray-500">CTO</p>
                  </div>
                </div>
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar src="https://images.pexels.com/photos/773371/pexels-photo-773371.jpeg" alt="Team Member" size="md" className="mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Jessica Chen</h3>
                    <p className="text-xs text-gray-500">Head of Product</p>
                  </div>
                </div>
                {entrepreneur.teamSize > 3 && (
                  <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500">+ {entrepreneur.teamSize - 3} more team members</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Collaboration Requests */}
          <CollaborationSection profileId={entrepreneur.id ?? (entrepreneur as any)._id} isCurrentUser={isCurrentUser} />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Funding */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Funding</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Current Round</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">{entrepreneur.fundingNeeded}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Valuation</span>
                  <p className="text-md font-medium text-gray-900">$8M - $12M</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Previous Funding</span>
                  <p className="text-md font-medium text-gray-900">$750K Seed (2022)</p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Funding Timeline</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Pre-seed</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Seed</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Series A</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {['Pitch Deck', 'Business Plan', 'Financial Projections'].map((doc) => (
                  <div key={doc} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-primary-50 rounded-md mr-3">
                      <FileText size={18} className="text-primary-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{doc}</h3>
                      <p className="text-xs text-gray-500">Updated recently</p>
                    </div>
                    {isConnected ? (
                      <Button variant="outline" size="sm">View</Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>Connect to View</Button>
                    )}
                  </div>
                ))}

                {!isCurrentUser && !isConnected && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Connect with {entrepreneur.name} to access detailed documents and financials.
                    </p>
                    {isCrossRole && connCheckDone && connStatus === 'none' && (
                      <Button className="mt-3 w-full" onClick={handleConnect} leftIcon={<Send size={16} />}>
                        Send Connection Request
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};