import { useEffect, useState, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Rocket,
  Globe,
  Building,
  Trash2,
  Edit,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

interface PaginatedResponse<T> {
  results: T[];
}

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

export default function Startups() {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website: '',
  });

  // ---------------------------------------------------------------------------
  // FETCH STARTUPS
  // ---------------------------------------------------------------------------
  const fetchStartups = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isFounder ? '/startups/my/' : '/startups/';
      const data = await apiClient.get<
        Startup[] | PaginatedResponse<Startup>
      >(endpoint);

      setStartups(Array.isArray(data) ? data : data.results || []);
    } catch (error: any) {
      console.error('Error fetching startups:', error);

      if (error.details?.networkError) {
        toast.error(
          error.message ||
            'Unable to connect to server. Backend may be starting up.'
        );
      } else {
        toast.error(error.message || 'Failed to load startups');
      }
    } finally {
      setLoading(false);
    }
  }, [isFounder]);

  useEffect(() => {
    if (user) {
      fetchStartups();
    }
  }, [user, fetchStartups]);

  // ---------------------------------------------------------------------------
  // CREATE / UPDATE STARTUP
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        industry: formData.industry || null,
        stage: formData.stage || null,
        website: formData.website || null,
      };

      if (editingStartup) {
        await apiClient.put(`/startups/${editingStartup.id}/`, payload);
        toast.success('Startup updated successfully!');
      } else {
        await apiClient.post('/startups/', payload);
        toast.success('Startup created successfully!');
      }

      setDialogOpen(false);
      resetForm();
      fetchStartups();
    } catch (error: any) {
      console.error('Error saving startup:', error);

      if (error.details?.networkError) {
        toast.error(
          'Connection failed. Please check your internet and try again.'
        );
      } else if (error.status === 400 && error.details) {
        const validationErrors = Object.entries(error.details)
          .map(
            ([field, messages]) =>
              `${field}: ${(messages as string[]).join(', ')}`
          )
          .join('; ');
        toast.error(`Validation error: ${validationErrors}`);
      } else if (error.status === 403) {
        toast.error('Only founders can manage startups');
      } else {
        toast.error(error.message || 'Failed to save startup');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DELETE STARTUP
  // ---------------------------------------------------------------------------
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this startup?')) return;

    try {
      await apiClient.delete(`/startups/${id}/`);
      toast.success('Startup deleted');
      fetchStartups();
    } catch (error: any) {
      console.error('Error deleting startup:', error);

      if (error.details?.networkError) {
        toast.error(
          'Connection failed. Please check your internet and try again.'
        );
      } else {
        toast.error(error.message || 'Failed to delete startup');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  const openEditDialog = (startup: Startup) => {
    setEditingStartup(startup);
    setFormData({
      name: startup.name,
      description: startup.description || '',
      industry: startup.industry || '',
      stage: startup.stage || '',
      website: startup.website || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      industry: '',
      stage: '',
      website: '',
    });
    setEditingStartup(null);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {isFounder ? 'My Startups' : 'Explore Startups'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isFounder
                ? 'Manage and showcase your startup ventures'
                : 'Discover exciting startup opportunities'}
            </p>
          </div>

          {isFounder && (
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Startup
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingStartup ? 'Edit Startup' : 'Create Startup'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingStartup
                      ? 'Update your startup information'
                      : 'Add your startup to the platform'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label>Startup Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Industry</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(v) =>
                          setFormData({ ...formData, industry: v })
                        }
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
                        onValueChange={(v) =>
                          setFormData({ ...formData, stage: v })
                        }
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
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading
                        ? 'Saving…'
                        : editingStartup
                        ? 'Update'
                        : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* GRID */}
        {loading ? (
          <p className="text-muted-foreground">Loading startups…</p>
        ) : startups.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Rocket className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                {isFounder
                  ? 'Create your first startup to get started.'
                  : 'No startups available right now.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup) => (
              <Card key={startup.id} className="shadow-card">
                <CardHeader>
                  <CardTitle>{startup.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    {startup.industry && (
                      <Badge variant="secondary">{startup.industry}</Badge>
                    )}
                    {startup.stage && (
                      <Badge variant="outline">{startup.stage}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {startup.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {startup.description}
                    </p>
                  )}
                  {startup.website && (
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary text-sm"
                    >
                      <Globe className="h-4 w-4" />
                      Visit website
                    </a>
                  )}
                  {isFounder && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(startup)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(startup.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
