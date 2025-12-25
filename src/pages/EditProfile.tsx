import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Save,
  X,
  Plus,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, ApiError } from '@/lib/apiClient';

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

type EditProfileError =
  | { type: 'network'; message: string }
  | { type: 'server'; message: string };

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<EditProfileError | null>(null);

  const [formData, setFormData] = useState({
    bio: '',
    skills: [] as string[],
    experience: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
  });

  const [newSkill, setNewSkill] = useState('');

  // ------------------------------------------------------------------
  // FETCH PROFILE
  // ------------------------------------------------------------------
  const fetchProfile = useCallback(
    async (isRetry = false) => {
      if (!user?.id) return;

      isRetry ? setRetrying(true) : setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<Profile>('/profiles/me/');
        setFormData({
          bio: data.bio || '',
          skills: data.skills || [],
          experience: data.experience || '',
          github_url: data.github_url || '',
          linkedin_url: data.linkedin_url || '',
          website_url: data.website_url || '',
        });
      } catch (err) {
        const apiError = err as ApiError;
        console.error('Edit profile fetch error:', apiError);

        if (apiError.isNetworkError) {
          setError({
            type: 'network',
            message:
              apiError.message ||
              'Network error. Backend may be starting.',
          });
        } else {
          setError({
            type: 'server',
            message: apiError.message || 'Failed to load profile.',
          });
          toast.error(apiError.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
        setRetrying(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ------------------------------------------------------------------
  // SAVE PROFILE
  // ------------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await apiClient.put('/profiles/me/', formData);
      toast.success('Profile updated successfully!');
      navigate(`/profile/${user?.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Edit profile save error:', apiError);

      if (apiError.isNetworkError) {
        toast.error(
          apiError.message ||
            'Connection failed. Please check your network.'
        );
        setError({
          type: 'network',
          message: apiError.message,
        });
      } else if (apiError.isValidationError && apiError.details) {
        const validationErrors = Object.entries(apiError.details)
          .map(
            ([field, messages]) =>
              `${field}: ${(messages as string[]).join(', ')}`
          )
          .join('; ');
        toast.error(`Validation error: ${validationErrors}`);
      } else {
        toast.error(apiError.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------------
  // SKILLS
  // ------------------------------------------------------------------
  const addSkill = () => {
    const skill = newSkill.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

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
  // ERROR (FETCH)
  // ------------------------------------------------------------------
  if (error && error.type === 'server') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>

          <Link to={`/profile/${user?.id}`}>
            <Button variant="outline">Back to Profile</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ------------------------------------------------------------------
  // MAIN FORM
  // ------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link to={`/profile/${user?.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex-1">
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground mt-1">
              Update your personal information
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>

        {error?.type === 'network' && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{error.message}</span>
              <Button
                onClick={() => fetchProfile(true)}
                variant="outline"
                size="sm"
                disabled={retrying}
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    retrying ? 'animate-spin' : ''
                  }`}
                />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* PROFILE HEADER */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user?.full_name || 'No name set'}
                </h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-accent text-sm rounded-full capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ABOUT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              About
            </CardTitle>
            <CardDescription>Tell others about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Write a brief introduction…"
            />
          </CardContent>
        </Card>

        {/* EXPERIENCE */}
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
            <CardDescription>
              Share your professional background
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              value={formData.experience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experience: e.target.value,
                })
              }
              placeholder="Describe your work experience…"
            />
          </CardContent>
        </Card>

        {/* SKILLS */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Highlight your expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" size="icon" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* LINKS */}
        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
            <CardDescription>
              Add your professional profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>GitHub URL</Label>
              <Input
                type="url"
                value={formData.github_url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    github_url: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    linkedin_url: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Website URL</Label>
              <Input
                type="url"
                value={formData.website_url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    website_url: e.target.value,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
