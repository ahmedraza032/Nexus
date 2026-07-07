import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle, Building2, MapPin, UserCircle, BarChart3, Briefcase,
  UserPlus, UserCheck, Clock, CheckCircle, XCircle, CalendarDays, Loader2,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Investor, Connection, ConnectionClientStatus } from '../../types';
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
  status, onConnect, onAccept, onDecline, onDisconnect, loading,
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
        <Button id="disconnect-btn" variant="outline" onClick={onDisconnect} leftIcon={<UserCheck size={18} />}>
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

  const loadConnections = async () => {
    try {
      const all = await getMyConnections();
      if (isCurrentUser) {
        setConnections(all);
      } else {
        const relevant = all.filter((c) => {
          const rId = (c.requester as any)._id?.toString() ?? c.requester._id;
          const aId = (c.recipient as any)._id?.toString() ?? c.recipient._id;
          return rId === profileId || aId === profileId;
        });
        setConnections(relevant);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConnections(); }, [profileId, isCurrentUser]);

  const handleRespond = async (connectionId: string, action: 'accepted' | 'rejected') => {
    try {
      await respondToRequest(connectionId, action);
      toast.success(action === 'accepted' ? 'Connection accepted!' : 'Connection declined');
      await loadConnections();
    } catch {
      toast.error('Action failed');
    }
  };

  const pendingReceived = connections.filter(
    (c) =>
      c.status === 'pending' &&
      ((c.recipient as any)._id?.toString() ?? c.recipient._id) === currentUser?.id
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
        {pendingReceived.length === 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            0 pending
          </span>
        )}
      </CardHeader>
      <CardBody>
        {connections.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No collaboration requests yet.</p>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => {
              const myId = currentUser?.id;
              const rId = (conn.requester as any)._id?.toString() ?? conn.requester._id;
              const other = rId === myId ? conn.recipient : conn.requester;
              const otherId = (other as any)._id?.toString() ?? other._id;
              const otherRole = other.role;
              const profilePath = `/profile/${otherRole === 'entrepreneur' ? 'entrepreneur' : 'investor'}/${otherId}`;
              const isRecipient =
                ((conn.recipient as any)._id?.toString() ?? conn.recipient._id) === myId;

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
                    {conn.status === 'accepted' && <span className="text-sm font-medium text-emerald-600">Accepted</span>}
                    {conn.status === 'rejected' && <span className="text-sm font-medium text-rose-500">Declined</span>}
                    {conn.status === 'pending' && isRecipient && <span className="text-sm font-medium text-amber-600">Pending</span>}
                    {conn.status === 'pending' && !isRecipient && <span className="text-sm font-medium text-gray-400">Sent</span>}
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
                          onClick={() => navigate(`/chat/${otherId}`)}
                        >
                          Message
                        </Button>
                      )}
                      {conn.status === 'pending' && isRecipient && (
                        <>
                          <Button size="sm" leftIcon={<CheckCircle size={14} />} onClick={() => handleRespond(conn._id, 'accepted')}>
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" leftIcon={<XCircle size={14} />} onClick={() => handleRespond(conn._id, 'rejected')}>
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
export const InvestorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [investor, setInvestor] = useState<Investor | null>(null);
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
        if (data.role === 'investor') {
          setInvestor(data as Investor);
        } else {
          setError('This profile is not an investor.');
        }
      } catch {
        setError('Investor not found.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

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

  if (error || !investor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Investor not found</h2>
        <p className="text-gray-600 mt-2">The investor profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard/entrepreneur">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === investor.id || currentUser?.id === (investor as any)._id;
  const isConnected = connStatus === 'accepted';
  const isCrossRole = currentUser?.role !== investor.role;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={investor.avatarUrl}
              alt={investor.name}
              size="xl"
              status={investor.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{investor.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Investor • {investor.totalInvestments} investments
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">
                  <MapPin size={14} className="mr-1" />
                  San Francisco, CA
                </Badge>
                {investor.investmentStage.map((stage, index) => (
                  <Badge key={index} variant="secondary" size="sm">{stage}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                {/* Message — only if connected */}
                {isConnected && (
                  <Link to={`/chat/${investor.id}`}>
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

                {/* Connect button — cross-role only */}
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
              <p className="text-gray-700">{investor.bio}</p>
            </CardBody>
          </Card>

          {/* Investment Interests */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Interests</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Industries</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {investor.investmentInterests.map((interest, index) => (
                      <Badge key={index} variant="primary" size="md">{interest}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">Investment Stages</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {investor.investmentStage.map((stage, index) => (
                      <Badge key={index} variant="secondary" size="md">{stage}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">Investment Criteria</h3>
                  <ul className="mt-2 space-y-2 text-gray-700">
                    {[
                      'Strong founding team with domain expertise',
                      'Clear market opportunity and product-market fit',
                      'Scalable business model with strong unit economics',
                      'Potential for significant growth and market impact',
                    ].map((item) => (
                      <li key={item} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Portfolio Companies */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Portfolio Companies</h2>
              <span className="text-sm text-gray-500">{investor.portfolioCompanies.length} companies</span>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {investor.portfolioCompanies.map((company, index) => (
                  <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                    <div className="p-3 bg-primary-50 rounded-md mr-3">
                      <Briefcase size={18} className="text-primary-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{company}</h3>
                      <p className="text-xs text-gray-500">Invested in 2022</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Collaboration Requests */}
          <CollaborationSection profileId={investor.id ?? (investor as any)._id} isCurrentUser={isCurrentUser} />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Investment Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Details</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Investment Range</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {investor.minimumInvestment} - {investor.maximumInvestment}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Investments</span>
                  <p className="text-md font-medium text-gray-900">{investor.totalInvestments} companies</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Typical Investment Timeline</span>
                  <p className="text-md font-medium text-gray-900">3-5 years</p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Investment Focus</span>
                  <div className="mt-2 space-y-2">
                    {[{ label: 'SaaS & B2B', pct: '75%' }, { label: 'FinTech', pct: '60%' }, { label: 'HealthTech', pct: '40%' }].map(({ label, pct }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-xs font-medium">{label}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary-600 h-2 rounded-full" style={{ width: pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Stats</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[{ label: 'Successful Exits', value: '4' }, { label: 'Avg. ROI', value: '3.2x' }, { label: 'Active Investments', value: String(investor.portfolioCompanies.length) }].map(({ label, value }) => (
                  <div key={label} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                        <p className="text-xl font-semibold text-primary-700 mt-1">{value}</p>
                      </div>
                      <BarChart3 size={24} className="text-primary-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};