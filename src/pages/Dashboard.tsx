import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Rocket, Users, Briefcase, TrendingUp, Plus, ArrowRight } from 'lucide-react';

interface Stats {
  totalStartups: number;
  totalFounders: number;
  totalTalent: number;
  myStartups: number;
}

const API_BASE_URL = 'http://localhost:8000/api';

export default function Dashboard() {
  const { user, tokens } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalStartups: 0,
    totalFounders: 0,
    totalTalent: 0,
    myStartups: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!tokens?.access) return;

      try {
        // Fetch total startups
        const startupsResponse = await fetch(`${API_BASE_URL}/startups/`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
          },
        });
        const startupsData = await startupsResponse.json();
        const totalStartups = startupsData.count || startupsData.length || 0;

        // Fetch users count by role
        const usersResponse = await fetch(`${API_BASE_URL}/auth/users/`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
          },
        });
        const usersData = await usersResponse.json();
        const totalFounders = usersData.filter((u: any) => u.role === 'founder').length;
        const totalTalent = usersData.filter((u: any) => u.role === 'talent').length;

        // Fetch my startups (if founder)
        let myStartups = 0;
        if (user?.role === 'founder') {
          const myStartupsResponse = await fetch(`${API_BASE_URL}/startups/my/`, {
            headers: {
              'Authorization': `Bearer ${tokens.access}`,
            },
          });
          const myStartupsData = await myStartupsResponse.json();
          myStartups = myStartupsData.length || 0;
        }

        setStats({
          totalStartups,
          totalFounders,
          totalTalent,
          myStartups,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && tokens) {
      fetchStats();
    }
  }, [user, tokens]);

  const statCards = [
    { 
      title: 'Total Startups', 
      value: stats.totalStartups, 
      icon: Rocket, 
      color: 'text-primary',
      bgColor: 'bg-accent'
    },
    { 
      title: 'Founders', 
      value: stats.totalFounders, 
      icon: Briefcase, 
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    { 
      title: 'Talent', 
      value: stats.totalTalent, 
      icon: Users, 
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    ...(user?.role === 'founder' ? [{
      title: 'My Startups', 
      value: stats.myStartups, 
      icon: TrendingUp, 
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }] : []),
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
                <div className="text-3xl font-display font-bold text-foreground">
                  {loading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Quick Actions</CardTitle>
              <CardDescription>
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link to="/profile">
                <Button variant="outline" className="w-full justify-between">
                  Complete your profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/startups">
                <Button variant="outline" className="w-full justify-between">
                  {user?.role === 'founder' ? 'Manage startups' : 'Explore startups'}
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

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Your Profile</CardTitle>
              <CardDescription>
                A quick overview of your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-foreground">{user?.full_name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded-full capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
              {user?.bio && (
                <p className="text-sm text-muted-foreground">{user.bio}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
