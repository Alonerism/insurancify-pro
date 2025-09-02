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
import { BarChart3, Download, Calendar, TrendingUp, FileText, DollarSign, Shield, AlertTriangle } from "lucide-react";

const availableReports = [
  {
    id: 1,
    name: "Policies Expiring in Next 30 Days",
    description: "List of all policies expiring within the next 30 days",
    category: "Renewals",
    lastGenerated: "2024-01-15",
    recordCount: 8,
    status: "ready",
  },
  {
    id: 2,
    name: "Coverage Gaps Analysis",
    description: "Properties with missing or insufficient coverage",
    category: "Coverage",
    lastGenerated: "2024-01-14",
    recordCount: 12,
    status: "ready",
  },
  {
    id: 3,
    name: "Annual Premium Summary by Carrier",
    description: "Total premiums paid to each insurance carrier",
    category: "Financial",
    lastGenerated: "2024-01-13",
    recordCount: 15,
    status: "ready",
  },
  {
    id: 4,
    name: "Open Claims Summary",
    description: "All open claims with reserves and status details",
    category: "Claims",
    lastGenerated: "2024-01-12",
    recordCount: 5,
    status: "ready",
  },
  {
    id: 5,
    name: "Property Insurance Portfolio",
    description: "Comprehensive overview of all properties and their insurance",
    category: "Portfolio",
    lastGenerated: "2024-01-10",
    recordCount: 24,
    status: "ready",
  },
];

const recentActivity = [
  {
    id: 1,
    report: "Policies Expiring in Next 30 Days",
    action: "Downloaded",
    user: "Sarah Mitchell",
    timestamp: "2024-01-15 10:30 AM",
  },
  {
    id: 2,
    report: "Coverage Gaps Analysis", 
    action: "Generated",
    user: "John Smith",
    timestamp: "2024-01-14 3:45 PM",
  },
  {
    id: 3,
    report: "Annual Premium Summary",
    action: "Scheduled",
    user: "System",
    timestamp: "2024-01-14 12:00 PM",
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
        <Button>
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
                        <Button size="sm" variant="outline">
                          <Download className="mr-1 h-3 w-3" />
                          Export
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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