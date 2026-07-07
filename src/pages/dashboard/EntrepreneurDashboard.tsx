import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle,
  Loader2, CheckCircle, XCircle, MessageCircle, UserPlus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import { Connection } from '../../types';
import { getMyConnections, respondToRequest } from '../../api/connectionApi';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const loadConnections = async () => {
    try {
      const data = await getMyConnections();
      setConnections(data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [, investorRes] = await Promise.all([
          loadConnections(),
          api.get('/profiles?role=investor'),
        ]);
        setInvestors(investorRes.data.map((u: any) => ({ ...u, id: u._id })));
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRespond = async (connectionId: string, action: 'accepted' | 'rejected') => {
    setResponding(connectionId);
    try {
      await respondToRequest(connectionId, action);
      toast.success(action === 'accepted' ? 'Connection accepted!' : 'Request declined');
      await loadConnections();
    } catch {
      toast.error('Action failed');
    } finally {
      setResponding(null);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  const myId = user.id;

  // Pending requests directed TO me (I am the recipient)
  const pendingIncoming = connections.filter(
    (c) =>
      c.status === 'pending' &&
      ((c.recipient as any)._id?.toString() ?? c.recipient._id) === myId
  );

  // Accepted connections count
  const acceptedCount = connections.filter((c) => c.status === 'accepted').length;

  const recommendedInvestors = investors.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />}>Find Investors</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Requests</p>
                <h3 className="text-xl font-semibold text-primary-900">{pendingIncoming.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                <h3 className="text-xl font-semibold text-secondary-900">{acceptedCount}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">{user.upcomingMeetings || 0}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-success-50 border border-success-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <TrendingUp size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Profile Views</p>
                <h3 className="text-xl font-semibold text-success-900">{user.profileViews || 0}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection requests */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Connection Requests</h2>
              <Badge variant="primary">{pendingIncoming.length} pending</Badge>
            </CardHeader>
            <CardBody>
              {pendingIncoming.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No connection requests yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    When investors are interested in your startup, their requests will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingIncoming.map((conn) => {
                    const myIdStr = user.id;
                    const rId = (conn.requester as any)._id?.toString() ?? conn.requester._id;
                    const other = rId === myIdStr ? conn.recipient : conn.requester;
                    const otherId = (other as any)._id?.toString() ?? other._id;
                    const profilePath = `/profile/${other.role}/${otherId}`;
                    const isIncoming =
                      ((conn.recipient as any)._id?.toString() ?? conn.recipient._id) === myIdStr;

                    return (
                      <div key={conn._id} className="border border-gray-200 rounded-lg p-4 transition-shadow hover:shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={other.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=random`}
                              alt={other.name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{other.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{other.role}</p>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(conn.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          {conn.status === 'accepted' && <span className="text-sm font-medium text-emerald-600">Accepted</span>}
                          {conn.status === 'rejected' && <span className="text-sm font-medium text-rose-500">Declined</span>}
                          {conn.status === 'pending' && isIncoming && (
                            <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                          )}
                          {conn.status === 'pending' && !isIncoming && (
                            <span className="text-sm font-medium text-gray-400">Sent</span>
                          )}
                        </div>

                        {conn.message && (
                          <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-1.5 italic">
                            {conn.message}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="flex gap-2">
                            {/* Accept/Decline for pending incoming */}
                            {conn.status === 'pending' && isIncoming && (
                              <>
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
                              </>
                            )}
                            {/* Message if accepted */}
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
        </div>

        {/* Recommended investors */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
              <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </CardHeader>
            <CardBody className="space-y-4">
              {recommendedInvestors.map((investor) => (
                <InvestorCard key={investor.id} investor={investor} showActions={false} />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};