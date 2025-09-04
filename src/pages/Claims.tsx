import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Search, Plus, MoreVertical, Building, Calendar, DollarSign, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAlerts, usePolicies, useBuildings } from "@/hooks/useApi";

export default function Claims() {
  const [searchTerm, setSearchTerm] = useState("");

  // Using alerts as proxy for claims since no dedicated claims endpoint exists
  const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useAlerts(100, false);
  const { data: policies = [] } = usePolicies();
  const { data: buildings = [] } = useBuildings();

  // Transform alerts to mock claims format
  const mockClaims = alerts.filter(alert => alert.alert_type === 'claim' || alert.message?.toLowerCase().includes('claim')).map((alert, index) => ({
    id: index + 1,
    claimNumber: `CLM-2024-${String(index + 1).padStart(3, '0')}`,
    type: alert.alert_type === 'claim' ? 'Property Damage' : 'General Claim',
    property: alert.policy_id ? buildings.find(b => policies.find(p => p.id === alert.policy_id)?.buildingId === b.id)?.name || 'Unknown Property' : 'Unknown Property',
    policy: alert.policy_id || 'Unknown Policy',
    incidentDate: new Date(alert.created_at).toISOString().split('T')[0],
    reportedDate: new Date(alert.created_at).toISOString().split('T')[0],
    status: alert.is_read ? 'closed' : 'open',
    reserves: '$25,000',
    paidAmount: alert.is_read ? '$22,500' : '$0',
    adjuster: 'System Generated',
    description: alert.message,
  }));

  // Add some static claims for demo if no real claims data
  const staticClaims = [
    {
      id: 999,
      claimNumber: "CLM-2024-001",
      type: "Water Damage",
      property: "Coming Soon",
      policy: "Demo Policy",
      incidentDate: "2024-01-10",
      reportedDate: "2024-01-12",
      status: "open",
      reserves: "$25,000",
      paidAmount: "$5,000",
      adjuster: "Demo Adjuster",
      description: "Claims functionality coming soon - backend integration needed",
    }
  ];

  const allClaims = mockClaims.length > 0 ? mockClaims : staticClaims;

  const filteredClaims = allClaims.filter((claim) =>
    claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { variant: "destructive" as const, text: "Open" },
      investigating: { variant: "secondary" as const, text: "Investigating" },
      closed: { variant: "outline" as const, text: "Closed" },
      denied: { variant: "destructive" as const, text: "Denied" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: "secondary" as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const totalReserves = allClaims.reduce((sum, claim) => sum + parseFloat(claim.reserves.replace(/[$,]/g, '')), 0);
  const totalPaid = allClaims.reduce((sum, claim) => sum + parseFloat(claim.paidAmount.replace(/[$,]/g, '')), 0);
  const openClaims = allClaims.filter(claim => claim.status === 'open' || claim.status === 'investigating').length;

  if (alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading claims...</span>
      </div>
    );
  }

  if (alertsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive">Unable to load claims</h3>
              <p className="text-muted-foreground mt-2">
                Claims functionality requires backend support. Currently showing demo data.
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Claims</h1>
          <p className="text-muted-foreground">
            Track and manage insurance claims across your property portfolio
          </p>
          {mockClaims.length === 0 && (
            <Badge variant="secondary" className="mt-2">Demo Mode - Backend Integration Needed</Badge>
          )}
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Report New Claim (Coming Soon)
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Claims</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{openClaims}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allClaims.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reserves</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalReserves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Reserved amounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Settlements paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search claims by number, type, property, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" disabled>Filter by Status (Coming Soon)</Button>
            <Button variant="outline" disabled>Filter by Type (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Insurance Claims
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim</TableHead>
                <TableHead>Property & Policy</TableHead>
                <TableHead>Incident Details</TableHead>
                <TableHead>Financial</TableHead>
                <TableHead>Adjuster</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{claim.claimNumber}</div>
                      <div className="text-sm text-muted-foreground">{claim.type}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1 font-medium">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        {claim.property}
                      </div>
                      <div className="text-sm text-muted-foreground">{claim.policy}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>Incident: {claim.incidentDate}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Reported: {claim.reportedDate}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                        {claim.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reserves:</span> {claim.reserves}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Paid:</span> {claim.paidAmount}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{claim.adjuster}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(claim.status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>View Details (Coming Soon)</DropdownMenuItem>
                        <DropdownMenuItem disabled>Add Note (Coming Soon)</DropdownMenuItem>
                        <DropdownMenuItem disabled>Upload Document (Coming Soon)</DropdownMenuItem>
                        <DropdownMenuItem disabled>Update Status (Coming Soon)</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}