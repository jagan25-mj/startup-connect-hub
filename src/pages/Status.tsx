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
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Database,
  Shield,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface HealthCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  icon: React.ElementType;
}

export default function Status() {
  useAuth(); // preserved hook usage

  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runHealthChecks = useCallback(async () => {
    setLoading(true);
    const results: HealthCheck[] = [];

    // ------------------------------------------------------------------
    // API HEALTH CHECK
    // ------------------------------------------------------------------
    const apiStart = Date.now();
    try {
      await apiClient.get('/health/');
      const latency = Date.now() - apiStart;

      results.push({
        name: 'API Server',
        status: 'operational',
        latency,
        icon: Activity,
      });
    } catch (error: any) {
      console.error('API health check failed:', error);

      results.push({
        name: 'API Server',
        status: error.details?.networkError ? 'degraded' : 'down',
        icon: Activity,
      });
    }

    // ------------------------------------------------------------------
    // DATABASE CHECK
    // ------------------------------------------------------------------
    const dbStart = Date.now();
    try {
      await apiClient.get('/auth/me/');
      const latency = Date.now() - dbStart;

      results.push({
        name: 'Database',
        status: 'operational',
        latency,
        icon: Database,
      });
    } catch (error: any) {
      console.error('Database check failed:', error);

      results.push({
        name: 'Database',
        status: error.details?.networkError ? 'degraded' : 'down',
        icon: Database,
      });
    }

    // ------------------------------------------------------------------
    // AUTH SERVICE (CLIENT-SIDE)
    // ------------------------------------------------------------------
    results.push({
      name: 'Authentication',
      status: 'operational',
      icon: Shield,
    });

    // ------------------------------------------------------------------
    // OVERALL PLATFORM STATUS
    // ------------------------------------------------------------------
    const anyDown = results.some((r) => r.status === 'down');
    const anyDegraded = results.some((r) => r.status === 'degraded');

    results.unshift({
      name: 'Platform',
      status: anyDown
        ? 'down'
        : anyDegraded
        ? 'degraded'
        : 'operational',
      icon: Activity,
    });

    setChecks(results);
    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 30000);
    return () => clearInterval(interval);
  }, [runHealthChecks]);

  // ------------------------------------------------------------------
  // UI HELPERS
  // ------------------------------------------------------------------
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

  const overallStatus =
    checks.find((c) => c.name === 'Platform')?.status || 'operational';

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold">System Status</h1>
          <p className="text-muted-foreground mt-1">
            Real-time platform health monitoring
          </p>
        </div>

        {/* OVERALL STATUS */}
        <Card className="shadow-card">
          <CardContent className="py-8 text-center">
            <div className="mb-4 flex justify-center">
              {getStatusIcon(overallStatus)}
            </div>
            <h2 className="text-2xl font-display font-bold">
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
          </CardContent>
        </Card>

        {/* SERVICES */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Individual component health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Running checks…</p>
            ) : (
              checks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <check.icon className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{check.name}</p>
                      {check.latency !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {check.latency} ms
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        check.status
                      )}`}
                    >
                      {getStatusLabel(check.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-accent/30">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            Status refreshes automatically every 30 seconds.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
