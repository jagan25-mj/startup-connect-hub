import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Rocket, AlertCircle } from 'lucide-react';
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
  created_at: string;
  updated_at: string;
}

type EditStartupError =
  | { type: 'not-found'; message: string }
  | { type: 'network'; message: string }
  | { type: 'server'; message: string };

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'AI/ML',
  'SaaS',
  'Consumer',
  'Other',
];

const STAGES = [
  'Idea',
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B+',
  'Growth',
];

export default function EditStartup() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<EditStartupError | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website: '',
  });

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

        if (data.owner_id !== user?.id) {
          toast.error('You can only edit your own startups');
          navigate('/startups');
          return;
        }

        setStartup(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          industry: data.industry || '',
          stage: data.stage || '',
          website: data.website || '',
        });
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
            message: err.message || 'Failed to load startup.',
          });
        }

        toast.error(err.message || 'Failed to load startup');
      } finally {
        setLoading(false);
      }
    };

    fetchStartup();
  }, [id, user?.id, navigate]);

  // ---------------------------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);

    try {
      await apiClient.put(`/startups/${id}/`, {
        name: formData.name,
        description: formData.description || null,
        industry: formData.industry || null,
        stage: formData.stage || null,
        website: formData.website || null,
      });

      toast.success('Startup updated successfully!');
      navigate(`/startups/${id}`);
    } catch (err: any) {
      console.error('Error updating startup:', err);

      if (err.details?.networkError) {
        toast.error('Connection failed. Please try again.');
      } else if (err.status === 400 && err.details) {
        const validationErrors = Object.entries(err.details)
          .map(
            ([field, messages]) =>
              `${field}: ${(messages as string[]).join(', ')}`
          )
          .join('; ');
        toast.error(`Validation error: ${validationErrors}`);
      } else {
        toast.error(err.message || 'Failed to update startup');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            <p className="text-muted-foreground">Loading startup…</p>
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
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/startups')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Startup</h1>
          </div>

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

          <Button variant="outline" onClick={() => navigate('/startups')}>
            Back to Startups
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!startup) return null;

  // ---------------------------------------------------------------------------
  // FORM
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/startups/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Startup</h1>
            <p className="text-muted-foreground">
              Update your startup information
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Startup Details
            </CardTitle>
            <CardDescription>
              Modify your startup information
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Startup Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    handleChange('description', e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(v) => handleChange('industry', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(v) => handleChange('stage', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Website</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/startups/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saving || !formData.name.trim()}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
