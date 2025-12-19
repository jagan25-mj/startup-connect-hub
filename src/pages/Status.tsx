import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Activity, Database, Shield, Zap } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  icon: React.ElementType;
}

export default function Status() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runHealthChecks = async () => {
    setLoading(true);
    const results: HealthCheck[] = [];

    // Database connectivity check
    const dbStart = Date.now();
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;
      results.push({
        name: 'Database',
        status: error ? 'degraded' : 'operational',
        latency: dbLatency,
        icon: Database,
      });
    } catch {
      results.push({
        name: 'Database',
        status: 'down',
        icon: Database,
      });
    }

    // Auth service check
    const authStart = Date.now();
    try {
      const { error } = await supabase.auth.getSession();
      const authLatency = Date.now() - authStart;
      results.push({
        name: 'Authentication',
        status: error ? 'degraded' : 'operational',
        latency: authLatency,
        icon: Shield,
      });
    } catch {
      results.push({
        name: 'Authentication',
        status: 'down',
        icon: Shield,
      });
    }

    // API responsiveness
    const apiStart = Date.now();
    try {
      const { count } = await supabase.from('startups').select('*', { count: 'exact', head: true });
      const apiLatency = Date.now() - apiStart;
      results.push({
        name: 'API',
        status: 'operational',
        latency: apiLatency,
        icon: Zap,
      });
    } catch {
      results.push({
        name: 'API',
        status: 'down',
        icon: Zap,
      });
    }

    // Overall platform status
    const allOperational = results.every((r) => r.status === 'operational');
    const anyDown = results.some((r) => r.status === 'down');
    results.unshift({
      name: 'Platform',
      status: anyDown ? 'down' : allOperational ? 'operational' : 'degraded',
      icon: Activity,
    });

    setChecks(results);
    setLastChecked(new Date());
    setLoading(false);
  };

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusLabel = (status: HealthCheck['status']) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded';
      case 'down':
        return 'Down';
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-success/10 text-success';
      case 'degraded':
        return 'bg-warning/10 text-warning';
      case 'down':
        return 'bg-destructive/10 text-destructive';
    }
  };

  const overallStatus = checks.find((c) => c.name === 'Platform')?.status || 'operational';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-foreground">System Status</h1>
          <p className="text-muted-foreground mt-1">Real-time platform health monitoring</p>
        </div>

        {/* Overall Status Banner */}
        <Card className={`shadow-card border-2 ${
          overallStatus === 'operational' 
            ? 'border-success/20' 
            : overallStatus === 'degraded' 
              ? 'border-warning/20' 
              : 'border-destructive/20'
        }`}>
          <CardContent className="py-8">
            <div className="flex flex-col items-center">
              <div className={`p-4 rounded-full mb-4 ${
                overallStatus === 'operational'
                  ? 'bg-success/10'
                  : overallStatus === 'degraded'
                    ? 'bg-warning/10'
                    : 'bg-destructive/10'
              }`}>
                {overallStatus === 'operational' ? (
                  <CheckCircle className="h-12 w-12 text-success" />
                ) : overallStatus === 'degraded' ? (
                  <AlertCircle className="h-12 w-12 text-warning" />
                ) : (
                  <XCircle className="h-12 w-12 text-destructive" />
                )}
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {overallStatus === 'operational'
                  ? 'All Systems Operational'
                  : overallStatus === 'degraded'
                    ? 'Partial System Degradation'
                    : 'System Outage'}
              </h2>
              {lastChecked && (
                <p className="text-sm text-muted-foreground mt-2">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Services */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Service Status</CardTitle>
            <CardDescription>Individual component health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 animate-pulse">
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-5 w-24 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : (
              checks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent">
                      <check.icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{check.name}</p>
                      {check.latency !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Response time: {check.latency}ms
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                      {getStatusLabel(check.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Uptime Notice */}
        <Card className="shadow-card bg-accent/30">
          <CardContent className="py-4">
            <p className="text-sm text-center text-muted-foreground">
              Status updates automatically every 30 seconds. For urgent issues, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
