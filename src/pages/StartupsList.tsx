import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Rocket,
  Building,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Startup, PaginatedResponse } from '@/types/api';

type StartupsError =
  | { type: 'network'; message: string }
  | { type: 'server'; message: string };

export default function StartupsList() {
  const { user } = useAuth();

  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StartupsError | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const isFounder = user?.role === 'founder';
  const pageSize = 20; // must match backend PAGE_SIZE

  // ---------------------------------------------------------------------------
  // FETCH STARTUPS
  // ---------------------------------------------------------------------------
  const fetchStartups = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = isFounder
          ? `/startups/my/`
          : `/startups/?page=${page}`;

        const data = await apiClient.get<
          PaginatedResponse<Startup> | Startup[]
        >(endpoint);

        if ('results' in data) {
          setStartups(data.results);
          setHasNext(data.next !== null);
          setHasPrevious(data.previous !== null);
          setTotalPages(Math.ceil(data.count / pageSize));
        } else {
          setStartups(data);
          setHasNext(false);
          setHasPrevious(false);
          setTotalPages(1);
        }
      } catch (err: any) {
        console.error('Error fetching startups:', err);

        if (err.details?.networkError) {
          setError({
            type: 'network',
            message: err.message,
          });
        } else {
          setError({
            type: 'server',
            message: err.message || 'Failed to load startups.',
          });
        }

        toast.error(err.message || 'Failed to load startups');
      } finally {
        setLoading(false);
      }
    },
    [isFounder, pageSize]
  );

  useEffect(() => {
    fetchStartups(currentPage);
  }, [fetchStartups, currentPage]);

  // ---------------------------------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------------------------------
  const handleNextPage = () => {
    if (hasNext) {
      setCurrentPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (hasPrevious) {
      setCurrentPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <p className="text-muted-foreground">Loading startups...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR STATE
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">
            {isFounder ? 'My Startups' : 'Explore Startups'}
          </h1>

          <Alert
            variant={error.type === 'network' ? 'default' : 'destructive'}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{error.message}</span>
              <Button
                onClick={() => fetchStartups(currentPage)}
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>

          {error.type === 'network' && (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Connection Issue
                </h3>
                <p className="text-muted-foreground mb-4">
                  If you are using Render free tier, the backend may be starting
                  up (this can take ~30 seconds).
                </p>
                <Button onClick={() => fetchStartups(currentPage)}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN VIEW
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {isFounder ? 'My Startups' : 'Explore Startups'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isFounder
                ? 'Manage your startup portfolio'
                : 'Discover amazing startups on our platform'}
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isFounder ? 'No startups yet' : 'No startups available'}
              </h3>
              <p className="text-muted-foreground mb-4 text-center">
                {isFounder
                  ? 'Create your first startup to get started.'
                  : 'Check back later for new startups.'}
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
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {startups.map((startup) => (
                <Card
                  key={startup.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="line-clamp-1">
                          {startup.name}
                        </CardTitle>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Building className="h-4 w-4" />
                          {startup.owner_name}
                        </p>
                      </div>

                      {startup.website && (
                        <a
                          href={startup.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!isFounder && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={!hasPrevious}
                  onClick={handlePreviousPage}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!hasNext}
                  onClick={handleNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
