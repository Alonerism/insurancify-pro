import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { AlertTriangle, Search, Plus, MoreVertical, Building, Calendar, DollarSign, FileText } from "lucide-react";

const mockClaims = [
  {
    id: 1,
    claimNumber: "CLM-2024-001",
    type: "Water Damage",
    property: "Oak Tower Building",
    policy: "PROP-2024-002",
    incidentDate: "2024-01-10",
    reportedDate: "2024-01-12",
    status: "open",
    reserves: "$25,000",
    paidAmount: "$5,000",
    adjuster: "Sarah Johnson - ABC Adjusters",
    description: "Burst pipe on 3rd floor causing water damage to multiple units",
  },
  {
    id: 2,
    claimNumber: "CLM-2024-002", 
    type: "Slip and Fall",
    property: "Downtown Office Complex",
    policy: "GL-2024-001",
    incidentDate: "2024-01-15",
    reportedDate: "2024-01-15",
    status: "investigating",
    reserves: "$15,000",
    paidAmount: "$0",
    adjuster: "Mike Chen - Superior Claims",
    description: "Visitor slipped in lobby area, reported minor injuries",
  },
  {
    id: 3,
    claimNumber: "CLM-2024-003",
    type: "Fire Damage",
    property: "Riverside Apartments",
    policy: "PROP-2024-003",
    incidentDate: "2023-12-20",
    reportedDate: "2023-12-20",
    status: "closed",
    reserves: "$50,000",
    paidAmount: "$47,500",
    adjuster: "Lisa Wong - National Adjusters",
    description: "Kitchen fire in unit 4B, smoke damage to adjacent units",
  },
];

export default function Claims() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClaims = mockClaims.filter((claim) =>
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

  const totalReserves = mockClaims.reduce((sum, claim) => sum + parseFloat(claim.reserves.replace(/[$,]/g, '')), 0);
  const totalPaid = mockClaims.reduce((sum, claim) => sum + parseFloat(claim.paidAmount.replace(/[$,]/g, '')), 0);
  const openClaims = mockClaims.filter(claim => claim.status === 'open' || claim.status === 'investigating').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Claims</h1>
          <p className="text-muted-foreground">
            Track and manage insurance claims across your property portfolio
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Report New Claim
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
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockClaims.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reserves</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalReserves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Reserved amounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Settlements paid
            </p>
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
            <Button variant="outline">Filter by Status</Button>
            <Button variant="outline">Filter by Type</Button>
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Add Note</DropdownMenuItem>
                        <DropdownMenuItem>Upload Document</DropdownMenuItem>
                        <DropdownMenuItem>Update Status</DropdownMenuItem>
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