import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Download, Calendar, TrendingUp, FileText, DollarSign, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { usePolicies } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";

const recentActivity = [
  {
    id: 1,
    report: "Policies Expiring Report",
    action: "Generated",
    user: "System",
    timestamp: new Date().toLocaleDateString(),
  },
  {
    id: 2,
    report: "Premium Summary", 
    action: "Generated",
    user: "System",
    timestamp: new Date().toLocaleDateString(),
  },
  {
    id: 3,
    report: "Portfolio Summary",
    action: "Generated",
    user: "System",
    timestamp: new Date().toLocaleDateString(),
  },
];

const getCategoryBadge = (category: string) => {
  const categoryMap = {
    Renewals: { variant: "destructive" as const, text: "Renewals" },
    Coverage: { variant: "secondary" as const, text: "Coverage" },
    Financial: { variant: "default" as const, text: "Financial" },
    Claims: { variant: "outline" as const, text: "Claims" },
    Portfolio: { variant: "outline" as const, text: "Portfolio" },
  };
  
  const config = categoryMap[category as keyof typeof categoryMap] || { variant: "outline" as const, text: category };
  return <Badge variant={config.variant}>{config.text}</Badge>;
};

export default function Reports() {
  const { data: policies = [], isLoading, error } = usePolicies();

  // Generate dynamic reports based on real data
  const availableReports = [
    {
      id: 1,
      name: "Policies Expiring in Next 30 Days",
      description: "List of all policies expiring within the next 30 days",
      category: "Renewals",
      lastGenerated: new Date().toLocaleDateString(),
      recordCount: policies.filter(p => {
        if (!p.expirationDate) return false;
        const expDate = new Date(p.expirationDate);
        const today = new Date();
        const daysUntil = (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil <= 30 && daysUntil > 0;
      }).length,
      status: "ready",
    },
    {
      id: 2,
      name: "Active Policies Summary", 
      description: "Overview of all active insurance policies",
      category: "Portfolio",
      lastGenerated: new Date().toLocaleDateString(),
      recordCount: policies.filter(p => p.status === 'active').length,
      status: "ready",
    },
    {
      id: 3,
      name: "Premium Analysis by Carrier",
      description: "Total premiums grouped by insurance carrier",
      category: "Financial",
      lastGenerated: new Date().toLocaleDateString(),
      recordCount: new Set(policies.map(p => p.carrier).filter(Boolean)).size,
      status: "ready",
    },
    {
      id: 4,
      name: "Coverage Distribution Report",
      description: "Breakdown of coverage types across portfolio",
      category: "Coverage",
      lastGenerated: new Date().toLocaleDateString(),
      recordCount: new Set(policies.map(p => p.coverageType).filter(Boolean)).size,
      status: "ready",
    },
    {
      id: 5,
      name: "Property Portfolio Overview",
      description: "Summary of all properties and associated policies",
      category: "Portfolio",
      lastGenerated: new Date().toLocaleDateString(),
      recordCount: new Set(policies.map(p => p.buildingId).filter(Boolean)).size,
      status: "ready",
    },
  ];

  const handleCustomReport = () => {
    toast({
      title: "Coming Soon",
      description: "Custom report builder will be available soon.",
    });
  };

  const handleExportReport = (reportName: string) => {
    toast({
      title: "Coming Soon",
      description: `Export for "${reportName}" will be available soon.`,
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load reports</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Generate insights and export data from your insurance portfolio
          </p>
        </div>
        <Button onClick={handleCustomReport}>
          <FileText className="mr-2 h-4 w-4" />
          Custom Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to generate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableReports.reduce((sum, report) => sum + report.recordCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-xs text-muted-foreground">
              Generated in January
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Reports</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Auto-generated
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Available Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {report.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(report.category)}
                      </TableCell>
                      <TableCell>{report.recordCount}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleExportReport(report.name)}>
                            <Download className="mr-1 h-3 w-3" />
                            Export
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.report} - {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user} • {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Risk & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Coverage Gap Analysis</li>
              <li>• Expiring Policies Report</li>
              <li>• Uninsured Properties</li>
              <li>• Policy Compliance Check</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-green-600" />
              Financial Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Premium Summary by Carrier</li>
              <li>• Claims Cost Analysis</li>
              <li>• Annual Cost Breakdown</li>
              <li>• Budget vs Actual</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Portfolio Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Property Portfolio Summary</li>
              <li>• Coverage Matrix Export</li>
              <li>• Policy Inventory Report</li>
              <li>• Carrier Relationship Summary</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}