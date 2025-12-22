import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Rocket, Users, Briefcase, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Startup, Interest, PaginatedResponse } from '@/types/api';

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
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<Interest[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const startupsData =
          await apiClient.get<PaginatedResponse<Startup>>('/startups/');
        const totalStartups = startupsData.count || 0;

        const usersData = await apiClient.get<User[]>('/auth/users/');
        const totalFounders = usersData.filter(
          (u) => u.role === 'founder'
        ).length;
        const totalTalent = usersData.filter(
          (u) => u.role === 'talent'
        ).length;

        let myStartups = 0;
        if (user?.role === 'founder') {
          const myStartupsData =
            await apiClient.get<Startup[]>('/startups/my/');
          myStartups = myStartupsData.length;
        }

        let myInterests: Interest[] = [];
        if (user?.role === 'talent') {
          myInterests = await apiClient.get<Interest[]>('/my/interests/');
        }

        setStats({
          totalStartups,
          totalFounders,
          totalTalent,
          myStartups,
        });
        setInterests(myInterests);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
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
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Talent',
      value: stats.totalTalent,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    ...(user?.role === 'founder'
      ? [
          {
            title: 'My Startups',
            value: stats.myStartups,
            icon: TrendingUp,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
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

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === 'founder'
                ? 'Manage your startups and find talented co-founders'
                : 'Discover exciting startup opportunities'}
            </p>
          </div>
          {user?.role === 'founder' && (
            <Link to="/startups">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Startup
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card
              key={stat.title}
              className="shadow-card hover:shadow-elevated transition-shadow animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
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
                  <div className="text-3xl font-display font-bold text-foreground">
                    {stat.value}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
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
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">My Interests</CardTitle>
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
                        {new Date(
                          interest.created_at
                        ).toLocaleDateString()}
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
