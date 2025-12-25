import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Github,
  Linkedin,
  Globe,
  Edit,
  Briefcase,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/apiClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  user_role: string;
  bio: string | null;
  skills: string[];
  experience: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

type ProfileError =
  | { type: 'not-found'; message: string }
  | { type: 'network'; message: string }
  | { type: 'unauthorized'; message: string }
  | { type: 'server'; message: string };

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<ProfileError | null>(null);

  const isOwnProfile = user?.id === id;

  const fetchProfile = useCallback(
    async (isRetry = false) => {
      if (!id) return;

      if (isRetry) {
        setRetrying(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await apiClient.get<Profile>(`/profiles/${id}/`);
        setProfile(data);
      } catch (err) {
        const apiError = err as ApiError;
        console.error('Profile fetch error:', apiError);

        if (apiError.status === 404) {
          setError({
            type: 'not-found',
            message: 'This profile does not exist or has been removed.',
          });
        } else if (apiError.isNetworkError) {
          setError({
            type: 'network',
            message:
              apiError.message ||
              'Network error. Backend may be starting up.',
          });
        } else if (apiError.status === 401 || apiError.status === 403) {
          setError({
            type: 'unauthorized',
            message: 'You do not have permission to view this profile.',
          });
        } else {
          setError({
            type: 'server',
            message: apiError.message || 'Failed to load profile.',
          });
        }

        toast.error(apiError.message || 'Failed to load profile');
      } finally {
        setLoading(false);
        setRetrying(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ------------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ------------------------------------------------------------------
  // ERROR STATES
  // ------------------------------------------------------------------
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto text-center">
          <Alert
            variant={error.type === 'network' ? 'default' : 'destructive'}
            className="mb-4 w-full"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>

          {error.type === 'network' && (
            <>
              <p className="text-muted-foreground mb-4">
                Backend may be starting up (Render free tier can take ~30–60
                seconds).
              </p>
              <Button
                variant="outline"
                onClick={() => fetchProfile(true)}
                disabled={retrying}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    retrying ? 'animate-spin' : ''
                  }`}
                />
                Try Again
              </Button>
            </>
          )}

          <Link to="/dashboard" className="mt-4">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ------------------------------------------------------------------
  // SAFE FALLBACK
  // ------------------------------------------------------------------
  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
          <p className="text-muted-foreground mb-4">
            The profile you're looking for doesn't exist.
          </p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ------------------------------------------------------------------
  // PROFILE VIEW
  // ------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{profile.user_full_name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4" />
              {profile.user_email}
            </p>
            <div className="mt-2">
              <Badge
                variant={
                  profile.user_role === 'founder'
                    ? 'default'
                    : 'secondary'
                }
              >
                {profile.user_role === 'founder' ? 'Founder' : 'Talent'}
              </Badge>
            </div>
          </div>

          {isOwnProfile && (
            <Link to="/profile/edit">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="whitespace-pre-wrap">
                  {profile.bio}
                </CardContent>
              </Card>
            )}

            {profile.experience && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="whitespace-pre-wrap">
                  {profile.experience}
                </CardContent>
              </Card>
            )}

            {profile.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {(profile.github_url ||
              profile.linkedin_url ||
              profile.website_url) && (
              <Card>
                <CardHeader>
                  <CardTitle>Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined{' '}
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Updated{' '}
                  {new Date(profile.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
