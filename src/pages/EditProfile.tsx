import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { User, Mail, Save, X, Plus, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

const API_BASE_URL = 'http://localhost:8000/api';

export default function EditProfile() {
  const { user, tokens } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    bio: '',
    skills: [] as string[],
    experience: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!tokens?.access || !user?.id) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/profiles/me/`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();
        setProfile(data);
        setFormData({
          bio: data.bio || '',
          skills: data.skills || [],
          experience: data.experience || '',
          github_url: data.github_url || '',
          linkedin_url: data.linkedin_url || '',
          website_url: data.website_url || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [tokens, user?.id]);

  const handleSave = async () => {
    if (!tokens?.access) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/me/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      navigate(`/profile/${user?.id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
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
            <h1 className="text-3xl font-display font-bold text-foreground">Edit Profile</h1>
            <p className="text-muted-foreground mt-1">Update your personal information</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-soft">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {user?.full_name || 'No name set'}
                </h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-accent text-accent-foreground text-sm font-medium rounded-full capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <User className="h-5 w-5" />
              About
            </CardTitle>
            <CardDescription>Tell others about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Write a brief bio about yourself..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Experience Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Experience</CardTitle>
            <CardDescription>Share your professional background</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Describe your experience..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Skills</CardTitle>
            <CardDescription>Highlight your expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Links</CardTitle>
            <CardDescription>Add your professional profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                id="github"
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}