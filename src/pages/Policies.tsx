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
import { Shield, Search, Plus, MoreVertical, Building, Calendar, DollarSign } from "lucide-react";

const mockPolicies = [
  {
    id: 1,
    policyNumber: "GL-2024-001",
    type: "General Liability",
    property: "Downtown Office Complex",
    carrier: "State Farm",
    broker: "ABC Insurance Brokers",
    effectiveDate: "2024-01-01",
    expirationDate: "2024-12-31",
    premium: "$12,500",
    status: "active",
    daysToExpiry: 334,
  },
  {
    id: 2,
    policyNumber: "PROP-2024-002",
    type: "Property Insurance",
    property: "Riverside Apartments",
    carrier: "Allstate",
    broker: "XYZ Risk Management",
    effectiveDate: "2024-02-15",
    expirationDate: "2025-02-14",
    premium: "$45,000",
    status: "active",
    daysToExpiry: 379,
  },
  {
    id: 3,
    policyNumber: "UMB-2024-003",
    type: "Umbrella",
    property: "Oak Tower Building",
    carrier: "Travelers",
    broker: "ABC Insurance Brokers",
    effectiveDate: "2024-01-15",
    expirationDate: "2024-03-15",
    premium: "$8,200",
    status: "expiring",
    daysToExpiry: 15,
  },
];

export default function Policies() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPolicies = mockPolicies.filter((policy) =>
    policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.carrier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, daysToExpiry: number) => {
    if (status === "expired") {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (daysToExpiry <= 30) {
      return <Badge variant="destructive">Expiring Soon</Badge>;
    }
    if (daysToExpiry <= 90) {
      return <Badge variant="secondary">Renewal Due</Badge>;
    }
    return <Badge variant="outline" className="text-green-600">Active</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Policies</h1>
          <p className="text-muted-foreground">
            Manage insurance policies across your property portfolio
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Policy
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search policies by number, type, property, or carrier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter by Type</Button>
            <Button variant="outline">Filter by Status</Button>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Insurance Policies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Carrier & Broker</TableHead>
                <TableHead>Coverage Period</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{policy.policyNumber}</div>
                      <div className="text-sm text-muted-foreground">{policy.type}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{policy.property}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{policy.carrier}</div>
                      <div className="text-sm text-muted-foreground">{policy.broker}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{policy.effectiveDate} - {policy.expirationDate}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {policy.daysToExpiry} days remaining
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {policy.premium}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(policy.status, policy.daysToExpiry)}
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
                        <DropdownMenuItem>Edit Policy</DropdownMenuItem>
                        <DropdownMenuItem>View Documents</DropdownMenuItem>
                        <DropdownMenuItem>Send Renewal Notice</DropdownMenuItem>
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