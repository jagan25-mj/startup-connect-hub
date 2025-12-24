import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Rocket } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

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

export default function CreateStartup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website: '',
  });

  // ---------------------------------------------------------------------------
  // REDIRECT NON-FOUNDERS (SAFE)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (user && user.role !== 'founder') {
      navigate('/startups');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'founder') {
    return null;
  }

  // ---------------------------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/startups/', {
        name: formData.name,
        description: formData.description || null,
        industry: formData.industry || null,
        stage: formData.stage || null,
        website: formData.website || null,
      });

      toast.success('Startup created successfully!');
      navigate('/startups');
    } catch (error: any) {
      console.error('Error creating startup:', error);

      // NETWORK ERROR (Render cold start / CORS / offline)
      if (error.details?.networkError) {
        toast.error(
          error.message ||
            'Unable to connect to server. Please try again in a moment.'
        );
      }
      // VALIDATION ERROR
      else if (error.status === 400 && error.details) {
        const validationErrors = Object.entries(error.details)
          .map(
            ([field, messages]) =>
              `${field}: ${(messages as string[]).join(', ')}`
          )
          .join('; ');
        toast.error(`Validation error: ${validationErrors}`);
      }
      // PERMISSION ERROR
      else if (error.status === 403) {
        toast.error('Only founders can create startups');
      }
      // FALLBACK
      else {
        toast.error(error.message || 'Failed to create startup');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/startups')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Create Startup
            </h1>
            <p className="text-muted-foreground mt-1">
              Add your startup to the platform
            </p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Startup Details
            </CardTitle>
            <CardDescription>
              Provide information about your startup
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Startup Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    handleInputChange('name', e.target.value)
                  }
                  placeholder="Enter your startup name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Describe your startup..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(v) =>
                      handleInputChange('industry', v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(v) =>
                      handleInputChange('stage', v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    handleInputChange('website', e.target.value)
                  }
                  placeholder="https://yourstartup.com"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/startups')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? 'Creating…' : 'Create Startup'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
