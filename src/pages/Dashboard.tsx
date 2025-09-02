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
} from "lucide-react";
import dashboardHero from "@/assets/dashboard-hero.jpg";

const kpiData = [
  {
    title: "Active Properties",
    value: "24",
    change: "+2 this month",
    trend: "up",
    icon: Building,
  },
  {
    title: "Active Policies",
    value: "67",
    change: "+5 renewed",
    trend: "up",
    icon: Shield,
  },
  {
    title: "Expiring Soon",
    value: "8",
    change: "Next 30 days",
    trend: "neutral",
    icon: Calendar,
  },
  {
    title: "Open Claims",
    value: "3",
    change: "-2 this week",
    trend: "down",
    icon: AlertTriangle,
  },
];

const recentAlerts = [
  {
    id: 1,
    type: "renewal",
    message: "General Liability policy for 123 Main St expires in 15 days",
    priority: "high",
    date: "2024-01-15",
  },
  {
    id: 2,
    type: "claim",
    message: "Water damage claim submitted for Oak Tower Building",
    priority: "medium",
    date: "2024-01-14",
  },
  {
    id: 3,
    type: "document",
    message: "COI required from ABC Contractors - expires tomorrow",
    priority: "high",
    date: "2024-01-13",
  },
];

const upcomingRenewals = [
  {
    id: 1,
    property: "123 Main Street",
    policy: "General Liability",
    carrier: "State Farm",
    expiresIn: 15,
    premium: "$12,500",
  },
  {
    id: 2,
    property: "Oak Tower Building",
    policy: "Property Insurance",
    carrier: "Allstate",
    expiresIn: 23,
    premium: "$45,000",
  },
  {
    id: 3,
    property: "Riverside Complex",
    policy: "Umbrella",
    carrier: "Travelers",
    expiresIn: 45,
    premium: "$8,200",
  },
];

export default function Dashboard() {
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
                  {kpi.trend === "down" && <TrendingDown className="mr-1 h-3 w-3 text-red-500" />}
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
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.date}</p>
                  </div>
                  <Badge
                    variant={alert.priority === "high" ? "destructive" : "secondary"}
                  >
                    {alert.priority}
                  </Badge>
                </div>
              ))}
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
                <span className="text-sm text-muted-foreground">95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Property Insurance</span>
                <span className="text-sm text-muted-foreground">88%</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Umbrella Coverage</span>
                <span className="text-sm text-muted-foreground">72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}