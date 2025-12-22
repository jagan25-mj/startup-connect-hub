import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Rocket, Globe, Building, Edit, Trash2, ExternalLink, Calendar } from 'lucide-react';
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

export default function StartupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [interested, setInterested] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interests, setInterests] = useState<Interest[]>([]);

  const isOwner = user?.id === startup?.owner_id;
  const isFounder = user?.role === 'founder';

  useEffect(() => {
    const fetchStartup = async () => {
      if (!id) return;

      try {
        const data = await apiClient.get<Startup>(`/startups/${id}/`);
        setStartup(data);
      } catch (error: any) {
        console.error('Error fetching startup:', error);
        if (error.status === 404) {
          toast.error('Startup not found');
          navigate('/startups');
        } else {
          toast.error('Failed to load startup details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStartup();
  }, [id, navigate]);

  useEffect(() => {
    const checkInterestAndFetchInterests = async () => {
      if (!id || !startup) return;

      // Check if user has expressed interest
      if (user?.role === 'talent') {
        try {
          const data = await apiClient.get<Interest[]>('/my/interests/');
          const hasInterest = data.some((interest) => interest.startup_id === id);
          setInterested(hasInterest);
        } catch (error) {
          console.error('Error checking interest:', error);
        }
      }

      // Fetch interests for owner
      if (isFounder && isOwner) {
        try {
          const data = await apiClient.get<Interest[]>(`/startups/${id}/interests/`);
          setInterests(data);
        } catch (error) {
          console.error('Error fetching interests:', error);
        }
      }
    };

    checkInterestAndFetchInterests();
  }, [id, startup, user, isFounder, isOwner]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this startup?')) return;
    if (!id) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/startups/${id}/`);
      toast.success('Startup deleted successfully');
      navigate('/startups');
    } catch (error) {
      console.error('Error deleting startup:', error);
      toast.error('Failed to delete startup');
    } finally {
      setDeleting(false);
    }
  };

  const handleInterest = async () => {
    if (!id) return;

    setInterestLoading(true);
    try {
      const method = interested ? 'delete' : 'post';
      const data = await apiClient[method]<{ message: string }>(
        `/startups/${id}/interest/`
      );

      toast.success(data.message);
      setInterested(!interested);
      setStartup((prev) =>
        prev
          ? {
              ...prev,
              interest_count: interested
                ? prev.interest_count - 1
                : prev.interest_count + 1,
            }
          : null
      );
    } catch (error: any) {
      console.error('Error updating interest:', error);
      toast.error(error.message || 'Failed to update interest');
    } finally {
      setInterestLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!startup) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Startup not found</h3>
          <p className="text-muted-foreground mb-4">
            The startup you're looking for doesn't exist.
          </p>
          <Link to="/startups">
            <Button>Back to Startups</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

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
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  {startup.name}
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Founded by {startup.owner_name}
                </p>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/startups/${startup.id}/edit`)}
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
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">About</CardTitle>
              </CardHeader>
              <CardContent>
                {startup.description ? (
                  <p className="text-foreground leading-relaxed">
                    {startup.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No description provided.
                  </p>
                )}
              </CardContent>
            </Card>

            {startup.website && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
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
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {startup.industry && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Industry</p>
                    <Badge variant="secondary" className="mt-1">
                      {startup.industry}
                    </Badge>
                  </div>
                )}

                {startup.stage && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stage</p>
                    <Badge variant="outline" className="mt-1">
                      {startup.stage}
                    </Badge>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created
                  </p>
                  <p className="text-sm text-foreground mt-1">
                    {new Date(startup.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interest Count</p>
                  <p className="text-sm text-foreground mt-1">
                    {startup.interest_count} {startup.interest_count === 1 ? 'person' : 'people'} interested
                  </p>
                </div>
              </CardContent>
            </Card>

            {user?.role === 'talent' && (
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Button
                      onClick={handleInterest}
                      disabled={interestLoading}
                      className="w-full"
                      variant={interested ? "outline" : "default"}
                    >
                      {interestLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : (
                        <Rocket className="h-4 w-4 mr-2" />
                      )}
                      {interested ? 'Withdraw Interest' : 'Express Interest'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {interested ? 'You have expressed interest in this startup' : 'Show your interest to the founder'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isFounder && isOwner && interests.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">Interested Talents</CardTitle>
                  <CardDescription>
                    {interests.length} {interests.length === 1 ? 'person' : 'people'} interested
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {interests.map((interest) => (
                      <div key={interest.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{interest.user_name}</p>
                          <p className="text-xs text-muted-foreground">{interest.user_email}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(interest.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!isFounder && user?.role !== 'talent' && (
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Rocket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Interested in starting your own startup?
                    </p>
                    <Link to="/profile" className="block mt-2">
                      <Button variant="outline" size="sm">
                        Update Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>

  );
}
