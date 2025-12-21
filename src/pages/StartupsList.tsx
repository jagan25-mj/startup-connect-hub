import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Rocket, Globe, Building, ExternalLink } from 'lucide-react';

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

const API_BASE_URL = 'http://localhost:8000/api';

export default function StartupsList() {
  const { user, tokens } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);

  const isFounder = user?.role === 'founder';

  const fetchStartups = useCallback(async () => {
    if (!tokens?.access) return;

    try {
      const endpoint = isFounder ? `${API_BASE_URL}/startups/my/` : `${API_BASE_URL}/startups/`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch startups');

      const data = await response.json();
      setStartups(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching startups:', error);
      toast.error('Failed to load startups');
    } finally {
      setLoading(false);
    }
  }, [tokens, isFounder]);

  useEffect(() => {
    if (user && tokens) {
      fetchStartups();
    }
  }, [user, tokens, fetchStartups]);

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
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {isFounder ? 'My Startups' : 'Explore Startups'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isFounder
                ? 'Manage your startup portfolio'
                : 'Discover amazing startups on our platform'
              }
            </p>
          </div>
          {isFounder && (
            <Link to="/startups/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Startup
              </Button>
            </Link>
          )}
        </div>

        {startups.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isFounder ? 'No startups yet' : 'No startups available'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {isFounder
                  ? 'Create your first startup to get started.'
                  : 'Check back later for new startups.'
                }
              </p>
              {isFounder && (
                <Link to="/startups/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Startup
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup) => (
              <Card key={startup.id} className="shadow-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-display text-xl line-clamp-1">
                        {startup.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4" />
                        {startup.owner_name}
                      </CardDescription>
                    </div>
                    {startup.website && (
                      <a
                        href={startup.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {startup.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {startup.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {startup.industry && (
                      <Badge variant="secondary" className="text-xs">
                        {startup.industry}
                      </Badge>
                    )}
                    {startup.stage && (
                      <Badge variant="outline" className="text-xs">
                        {startup.stage}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {startup.interest_count} interested
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(startup.created_at).toLocaleDateString()}
                    </span>
                    <Link to={`/startups/${startup.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}