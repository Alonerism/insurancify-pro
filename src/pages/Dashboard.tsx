import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building,
  Shield,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Loader2,
} from "lucide-react";
import dashboardHero from "@/assets/dashboard-hero.jpg";
import { useSystemStats, useAlerts, useBuildings, usePolicies } from "@/hooks/useApi";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useSystemStats();
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts(5, false);
  const { data: buildings = [] } = useBuildings();
  const { data: policies = [] } = usePolicies();

  // Calculate KPIs from real data
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const expiringSoon = policies.filter(p => {
    const expDate = new Date(p.expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  }).length;

  const kpiData = [
    {
      title: "Active Properties",
      value: buildings.length.toString(),
      change: `${buildings.length} total`,
      trend: "neutral" as const,
      icon: Building,
    },
    {
      title: "Active Policies", 
      value: activePolicies.toString(),
      change: `of ${policies.length} total`,
      trend: "up" as const,
      icon: Shield,
    },
    {
      title: "Expiring Soon",
      value: expiringSoon.toString(),
      change: "Next 30 days",
      trend: expiringSoon > 0 ? "up" as const : "neutral" as const,
      icon: Calendar,
    },
    {
      title: "Open Alerts",
      value: alerts.length.toString(),
      change: "Requires attention",
      trend: "neutral" as const,
      icon: AlertTriangle,
    },
  ];

  // Get upcoming renewals from policies
  const upcomingRenewals = policies
    .filter(policy => {
      const expDate = new Date(policy.expirationDate);
      const today = new Date();
      const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return daysUntilExpiration <= 60 && daysUntilExpiration > 0;
    })
    .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
    .slice(0, 5)
    .map(policy => {
      const building = buildings.find(b => b.id === policy.buildingId);
      const expDate = new Date(policy.expirationDate);
      const today = new Date();
      const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      return {
        id: policy.id,
        property: building?.name || 'Unknown Property',
        policy: policy.coverageType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        carrier: policy.carrier,
        expiresIn: daysUntilExpiration,
        premium: `$${policy.premiumAnnual.toLocaleString()}`,
      };
    });

  // Calculate coverage percentages
  const coverageStats = {
    'General Liability': policies.filter(p => p.coverageType === 'general-liability').length,
    'Property Insurance': policies.filter(p => p.coverageType === 'property').length,
    'Umbrella Coverage': policies.filter(p => p.coverageType === 'umbrella').length,
  };
  
  const totalBuildings = buildings.length || 1; // Prevent division by zero
  const coveragePercentages = {
    'General Liability': Math.round((coverageStats['General Liability'] / totalBuildings) * 100),
    'Property Insurance': Math.round((coverageStats['Property Insurance'] / totalBuildings) * 100),
    'Umbrella Coverage': Math.round((coverageStats['Umbrella Coverage'] / totalBuildings) * 100),
  };

  if (statsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive">Unable to load dashboard data</h3>
              <p className="text-muted-foreground mt-2">
                Please check your backend connection and try again.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
        <img
          src={dashboardHero}
          alt="Insurance Management Dashboard"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative p-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to Insurance Master
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage your real estate insurance portfolio with confidence
          </p>
          <div className="mt-6 flex gap-4">
            <Button>Add New Policy</Button>
            <Button variant="outline">View Properties</Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {kpi.trend === "up" && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
                  {kpi.change}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.slice(0, 3).map((alert, index) => (
                <div
                  key={alert.id || index}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message || alert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <Badge
                    variant={alert.priority === "high" ? "destructive" : "secondary"}
                  >
                    {alert.priority || 'normal'}
                  </Badge>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No recent alerts
                </div>
              )}
            </div>
            <Button variant="outline" className="mt-4 w-full">
              View All Alerts
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRenewals.map((renewal) => (
                <div
                  key={renewal.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{renewal.property}</p>
                    <p className="text-xs text-muted-foreground">
                      {renewal.policy} • {renewal.carrier}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={renewal.expiresIn <= 30 ? "destructive" : "secondary"}
                    >
                      {renewal.expiresIn}d
                    </Badge>
                    <p className="text-xs text-muted-foreground">{renewal.premium}</p>
                  </div>
                </div>
              ))}
              {upcomingRenewals.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No upcoming renewals
                </div>
              )}
            </div>
            <Button variant="outline" className="mt-4 w-full">
              View All Renewals
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Coverage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">General Liability</span>
                <span className="text-sm text-muted-foreground">{coveragePercentages['General Liability']}%</span>
              </div>
              <Progress value={coveragePercentages['General Liability']} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Property Insurance</span>
                <span className="text-sm text-muted-foreground">{coveragePercentages['Property Insurance']}%</span>
              </div>
              <Progress value={coveragePercentages['Property Insurance']} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Umbrella Coverage</span>
                <span className="text-sm text-muted-foreground">{coveragePercentages['Umbrella Coverage']}%</span>
              </div>
              <Progress value={coveragePercentages['Umbrella Coverage']} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}