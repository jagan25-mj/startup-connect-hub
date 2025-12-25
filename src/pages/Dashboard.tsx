import { useEffect, useState } from 'react';
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
import { Link } from 'react-router-dom';
import {
  Rocket,
  Users,
  Briefcase,
  TrendingUp,
  Plus,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  User,
  Startup,
  Interest,
  PaginatedResponse,
} from '@/types/api';

interface Stats {
  totalStartups: number;
  totalFounders: number;
  totalTalent: number;
  myStartups: number;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({
    totalStartups: 0,
    totalFounders: 0,
    totalTalent: 0,
    myStartups: 0,
  });
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchDashboardData = async (isRetry = false) => {
    if (!user) return;

    if (isRetry) {
      setRetrying(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      // Fetch with proper error handling for each request
      let totalStartups = 0;
      let totalFounders = 0;
      let totalTalent = 0;
      let myStartups = 0;
      let myInterests: Interest[] = [];

      // Startups count
      try {
        const startupsData = await apiClient.get<PaginatedResponse<Startup>>('/startups/');
        totalStartups = startupsData.count || startupsData.results?.length || 0;
      } catch (err) {
        console.warn('Failed to fetch startups:', err);
      }

      // Users
      try {
        const usersData = await apiClient.get<User[]>('/auth/users/');
        totalFounders = usersData.filter((u) => u.role === 'founder').length;
        totalTalent = usersData.filter((u) => u.role === 'talent').length;
      } catch (err) {
        console.warn('Failed to fetch users:', err);
      }

      // Founder-specific data
      if (user.role === 'founder') {
        try {
          const myStartupsData = await apiClient.get<Startup[]>('/startups/my/');
          myStartups = myStartupsData.length;
        } catch (err) {
          console.warn('Failed to fetch my startups:', err);
        }
      }

      // Talent-specific data
      if (user.role === 'talent') {
        try {
          myInterests = await apiClient.get<Interest[]>('/my/interests/');
        } catch (err) {
          console.warn('Failed to fetch interests:', err);
        }
      }

      setStats({
        totalStartups,
        totalFounders,
        totalTalent,
        myStartups,
      });
      setInterests(myInterests);
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Dashboard error:', apiError);
      setError(apiError);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const statCards = [
    {
      title: 'Total Startups',
      value: stats.totalStartups,
      icon: Rocket,
      color: 'text-primary',
      bgColor: 'bg-accent',
    },
    {
      title: 'Founders',
      value: stats.totalFounders,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Talent',
      value: stats.totalTalent,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    ...(user?.role === 'founder'
      ? [
          {
            title: 'My Startups',
            value: stats.myStartups,
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
          },
        ]
      : []),
    ...(user?.role === 'talent'
      ? [
          {
            title: 'My Interests',
            value: interests.length,
            icon: Rocket,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
          },
        ]
      : []),
  ];

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === 'founder'
                ? 'Manage your startups and find talented co-founders'
                : 'Discover exciting startup opportunities'}
            </p>
          </div>

          {user?.role === 'founder' && (
            <Link to="/startups/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Startup
              </Button>
            </Link>
          )}
        </div>

        {error && (
          <Alert variant={error.isNetworkError ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium">{error.message}</p>
                {error.isRenderColdStart && (
                  <p className="text-xs mt-1 opacity-75">
                    The backend is starting up (Render free tier). This usually takes 30-60 seconds.
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDashboardData(true)}
                disabled={retrying}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying...' : 'Retry'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card
              key={stat.title}
              className="shadow-card hover:shadow-elevated transition-shadow animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-10 w-20" />
                ) : (
                  <div className="text-3xl font-display font-bold">
                    {stat.value}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link to={user?.id ? `/profile/${user.id}` : '/dashboard'}>
                <Button variant="outline" className="w-full justify-between">
                  Complete your profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/startups">
                <Button variant="outline" className="w-full justify-between">
                  {user?.role === 'founder'
                    ? 'Manage startups'
                    : 'Explore startups'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/status">
                <Button variant="outline" className="w-full justify-between">
                  Check platform status
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {user?.role === 'talent' && interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>My Interests</CardTitle>
                <CardDescription>
                  Startups you've expressed interest in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {interests.slice(0, 3).map((interest) => (
                  <div
                    key={interest.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {interest.startup_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Interested{' '}
                        {new Date(interest.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link to={`/startups/${interest.startup_id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}