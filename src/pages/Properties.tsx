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
import { Building, Search, Plus, MoreVertical, MapPin, Shield } from "lucide-react";

const mockProperties = [
  {
    id: 1,
    name: "Downtown Office Complex",
    address: "123 Main Street, Los Angeles, CA 90210",
    units: 25,
    totalPolicies: 8,
    activePolicies: 6,
    expiringPolicies: 2,
    totalCoverage: "$2,500,000",
    lastUpdated: "2024-01-15",
  },
  {
    id: 2,
    name: "Riverside Apartments",
    address: "456 River Drive, Los Angeles, CA 90211",
    units: 48,
    totalPolicies: 12,
    activePolicies: 10,
    expiringPolicies: 1,
    totalCoverage: "$4,800,000",
    lastUpdated: "2024-01-14",
  },
  {
    id: 3,
    name: "Oak Tower Building",
    address: "789 Oak Avenue, Los Angeles, CA 90212",
    units: 35,
    totalPolicies: 15,
    activePolicies: 13,
    expiringPolicies: 3,
    totalCoverage: "$6,200,000",
    lastUpdated: "2024-01-13",
  },
];

export default function Properties() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProperties = mockProperties.filter((property) =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground">
            Manage your real estate portfolio and associated policies
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search properties by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Properties Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{property.name}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {property.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{property.units}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{property.activePolicies}</span>
                      <span className="text-muted-foreground">/ {property.totalPolicies}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {property.totalCoverage}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-green-600">
                        {property.activePolicies} Active
                      </Badge>
                      {property.expiringPolicies > 0 && (
                        <Badge variant="destructive">
                          {property.expiringPolicies} Expiring
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {property.lastUpdated}
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
                        <DropdownMenuItem>Edit Property</DropdownMenuItem>
                        <DropdownMenuItem>View Policies</DropdownMenuItem>
                        <DropdownMenuItem>View Claims</DropdownMenuItem>
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