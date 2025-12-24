import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Rocket,
  Globe,
  Building,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/apiClient';

interface Startup {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  website: string | null;
  owner_id: string;
  owner_name: string;
  interest_count: number;
  created_at: string;
  updated_at: string;
}

interface Interest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  startup_id: string;
  startup_name: string;
  created_at: string;
}

type StartupError =
  | { type: 'not-found'; message: string }
  | { type: 'network'; message: string }
  | { type: 'server'; message: string };

export default function StartupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StartupError | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [interested, setInterested] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interests, setInterests] = useState<Interest[]>([]);

  const isOwner = user?.id === startup?.owner_id;
  const isFounder = user?.role === 'founder';

  // ---------------------------------------------------------------------------
  // FETCH STARTUP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!id) return;

    const fetchStartup = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<Startup>(`/startups/${id}/`);
        setStartup(data);
      } catch (err: any) {
        console.error('Error fetching startup:', err);

        if (err.status === 404) {
          setError({
            type: 'not-found',
            message: 'This startup does not exist or has been removed.',
          });
        } else if (err.details?.networkError) {
          setError({
            type: 'network',
            message: err.message || 'Unable to connect to server.',
          });
        } else {
          setError({
            type: 'server',
            message: err.message || 'Failed to load startup details.',
          });
        }

        toast.error(err.message || 'Failed to load startup details');
      } finally {
        setLoading(false);
      }
    };

    fetchStartup();
  }, [id]);

  // ---------------------------------------------------------------------------
  // INTEREST CHECK + FETCH INTERESTS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!id || !startup) return;

    const loadInterestData = async () => {
      if (user?.role === 'talent') {
        try {
          const data = await apiClient.get<Interest[]>('/my/interests/');
          setInterested(data.some((i) => i.startup_id === id));
        } catch {
          /* non-critical */
        }
      }

      if (isFounder && isOwner) {
        try {
          const data = await apiClient.get<Interest[]>(
            `/startups/${id}/interests/`
          );
          setInterests(data);
        } catch {
          /* non-critical */
        }
      }
    };

    loadInterestData();
  }, [id, startup, user, isFounder, isOwner]);

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this startup?')) return;
    if (!id) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/startups/${id}/`);
      toast.success('Startup deleted successfully');
      navigate('/startups');
    } catch (err: any) {
      toast.error(
        err.details?.networkError
          ? 'Connection failed. Please try again.'
          : err.message || 'Failed to delete startup'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // INTEREST TOGGLE
  // ---------------------------------------------------------------------------
  const handleInterest = async () => {
    if (!id) return;

    setInterestLoading(true);
    try {
      const method = interested ? 'delete' : 'post';
      const res = await apiClient[method]<{ message: string }>(
        `/startups/${id}/interest/`
      );

      toast.success(res.message);
      setInterested(!interested);
      setStartup((prev) =>
        prev
          ? {
              ...prev,
              interest_count: interested
                ? prev.interest_count - 1
                : prev.interest_count + 1,
            }
          : prev
      );
    } catch (err: any) {
      toast.error(
        err.details?.networkError
          ? 'Connection failed. Please try again.'
          : err.message || 'Failed to update interest'
      );
    } finally {
      setInterestLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              Loading startup details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Alert
            variant={error.type === 'network' ? 'default' : 'destructive'}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{error.message}</span>
              {error.type === 'network' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>

          <Link to="/startups">
            <Button variant="outline">Back to Startups</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!startup) return null;

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/startups')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{startup.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Building className="h-4 w-4" />
                Founded by {startup.owner_name}
              </p>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/startups/${startup.id}/edit`)
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {startup.description || (
                  <p className="italic text-muted-foreground">
                    No description provided.
                  </p>
                )}
              </CardContent>
            </Card>

            {startup.website && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={startup.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    {startup.website}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {startup.industry && (
                  <Badge variant="secondary">{startup.industry}</Badge>
                )}
                {startup.stage && (
                  <Badge variant="outline">{startup.stage}</Badge>
                )}

                <Separator />

                <p className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  {new Date(startup.created_at).toLocaleDateString()}
                </p>

                <p className="text-sm">
                  {startup.interest_count} interested
                </p>
              </CardContent>
            </Card>

            {user?.role === 'talent' && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Button
                    className="w-full"
                    onClick={handleInterest}
                    disabled={interestLoading}
                    variant={interested ? 'outline' : 'default'}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    {interested
                      ? 'Withdraw Interest'
                      : 'Express Interest'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {isFounder && isOwner && interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Interested Talents</CardTitle>
                  <CardDescription>
                    {interests.length} interested
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interests.map((i) => (
                    <div
                      key={i.id}
                      className="flex justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {i.user_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {i.user_email}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(i.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
