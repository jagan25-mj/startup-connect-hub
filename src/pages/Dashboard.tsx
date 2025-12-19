import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Rocket, Users, Briefcase, TrendingUp, Plus, ArrowRight } from 'lucide-react';

interface Stats {
  totalStartups: number;
  totalFounders: number;
  totalTalent: number;
  myStartups: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalStartups: 0,
    totalFounders: 0,
    totalTalent: 0,
    myStartups: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total startups
        const { count: startupsCount } = await supabase
          .from('startups')
          .select('*', { count: 'exact', head: true });

        // Fetch founders count
        const { count: foundersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'founder');

        // Fetch talent count
        const { count: talentCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'talent');

        // Fetch my startups (if founder)
        let myStartupsCount = 0;
        if (profile?.role === 'founder') {
          const { count } = await supabase
            .from('startups')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', profile.id);
          myStartupsCount = count || 0;
        }

        setStats({
          totalStartups: startupsCount || 0,
          totalFounders: foundersCount || 0,
          totalTalent: talentCount || 0,
          myStartups: myStartupsCount,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchStats();
    }
  }, [profile]);

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
    ...(profile?.role === 'founder' ? [{
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
              Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {profile?.role === 'founder' 
                ? 'Manage your startups and find talented co-founders'
                : 'Discover exciting startup opportunities'}
            </p>
          </div>
          {profile?.role === 'founder' && (
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
                  {profile?.role === 'founder' ? 'Manage startups' : 'Explore startups'}
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
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-foreground">{profile?.full_name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded-full capitalize">
                    {profile?.role}
                  </span>
                </div>
              </div>
              {profile?.bio && (
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
