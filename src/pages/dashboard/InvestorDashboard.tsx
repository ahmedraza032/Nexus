import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, PieChart, Filter, Search, PlusCircle, Loader2,
  UserPlus, CheckCircle, XCircle, MessageCircle, AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { Connection } from '../../types';
import { getMyConnections, respondToRequest } from '../../api/connectionApi';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
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
        const [, entRes] = await Promise.all([
          loadConnections(),
          api.get('/profiles?role=entrepreneur'),
        ]);
        setEntrepreneurs(entRes.data.map((u: any) => ({ ...u, id: u._id })));
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

  if (!user) return null;

  const myId = user.id;

  // Pending requests received by me
  const pendingIncoming = connections.filter(
    (c) =>
      c.status === 'pending' &&
      ((c.recipient as any)._id?.toString() ?? c.recipient._id) === myId
  );
  const acceptedCount = connections.filter((c) => c.status === 'accepted').length;

  // Filter entrepreneurs
  const filteredEntrepreneurs = entrepreneurs.filter((e) => {
    const matchesSearch =
      searchQuery === '' ||
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.startupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.pitchSummary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry =
      selectedIndustries.length === 0 || selectedIndustries.includes(e.industry);
    return matchesSearch && matchesIndustry;
  });

  const industries = Array.from(new Set(entrepreneurs.map((e) => e.industry).filter(Boolean)));

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        <Link to="/entrepreneurs">
          <Button leftIcon={<PlusCircle size={18} />}>View All Startups</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Your Connections</p>
                <h3 className="text-xl font-semibold text-accent-900">{acceptedCount}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── Pending Connection Requests ──────────────────────────────────── */}
      {pendingIncoming.length > 0 && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <UserPlus size={18} className="text-secondary-600" />
              Connection Requests
            </h2>
            <Badge variant="primary">{pendingIncoming.length} pending</Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {pendingIncoming.map((conn) => {
                const other = conn.requester;
                const otherId = (other as any)._id?.toString() ?? other._id;
                const profilePath = `/profile/${other.role}/${otherId}`;

                return (
                  <div key={conn._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
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
                      <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>

                    {conn.message && (
                      <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-1.5 italic">
                        {conn.message}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex gap-2">
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
                      </div>
                      <Link to={profilePath}>
                        <Button variant="primary" size="sm">View Profile</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search startups, industries, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>
        <div className="w-full md:w-1/3">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            <div className="flex flex-wrap gap-2">
              {industries.map((industry: any) => (
                <Badge
                  key={industry}
                  variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                  className="cursor-pointer"
                  onClick={() => toggleIndustry(industry)}
                >
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Entrepreneurs grid */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
        </CardHeader>
        <CardBody>
          {filteredEntrepreneurs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntrepreneurs.map((entrepreneur) => (
                <EntrepreneurCard key={entrepreneur.id} entrepreneur={entrepreneur} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No startups match your filters</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => { setSearchQuery(''); setSelectedIndustries([]); }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};