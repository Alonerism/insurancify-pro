import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Grid3X3, Building, AlertTriangle, Plus, Eye } from "lucide-react";

const properties = [
  "Downtown Office Complex",
  "Riverside Apartments", 
  "Oak Tower Building",
  "Sunset Plaza Mall",
];

const coverageTypes = [
  "General Liability",
  "Property Insurance", 
  "Umbrella",
  "Workers' Comp",
  "Flood Insurance",
  "Earthquake",
];

const mockCoverageData = {
  "Downtown Office Complex": {
    "General Liability": { status: "active", limit: "$2M", expiry: "2024-12-31" },
    "Property Insurance": { status: "active", limit: "$5M", expiry: "2024-11-15" },
    "Umbrella": { status: "expiring", limit: "$10M", expiry: "2024-03-15" },
    "Workers' Comp": { status: "active", limit: "$1M", expiry: "2024-08-20" },
    "Flood Insurance": { status: "missing", limit: null, expiry: null },
    "Earthquake": { status: "active", limit: "$3M", expiry: "2024-09-30" },
  },
  "Riverside Apartments": {
    "General Liability": { status: "active", limit: "$3M", expiry: "2025-02-14" },
    "Property Insurance": { status: "active", limit: "$8M", expiry: "2025-01-10" },
    "Umbrella": { status: "active", limit: "$15M", expiry: "2024-12-01" },
    "Workers' Comp": { status: "expiring", limit: "$2M", expiry: "2024-03-30" },
    "Flood Insurance": { status: "active", limit: "$2M", expiry: "2024-07-15" },
    "Earthquake": { status: "missing", limit: null, expiry: null },
  },
  "Oak Tower Building": {
    "General Liability": { status: "active", limit: "$4M", expiry: "2024-10-15" },
    "Property Insurance": { status: "expiring", limit: "$12M", expiry: "2024-03-20" },
    "Umbrella": { status: "active", limit: "$20M", expiry: "2024-11-30" },
    "Workers' Comp": { status: "active", limit: "$3M", expiry: "2024-06-15" },
    "Flood Insurance": { status: "missing", limit: null, expiry: null },
    "Earthquake": { status: "active", limit: "$5M", expiry: "2024-12-25" },
  },
  "Sunset Plaza Mall": {
    "General Liability": { status: "missing", limit: null, expiry: null },
    "Property Insurance": { status: "missing", limit: null, expiry: null },
    "Umbrella": { status: "missing", limit: null, expiry: null },
    "Workers' Comp": { status: "missing", limit: null, expiry: null },
    "Flood Insurance": { status: "missing", limit: null, expiry: null },
    "Earthquake": { status: "missing", limit: null, expiry: null },
  },
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="text-green-600">Active</Badge>;
    case "expiring":
      return <Badge variant="destructive">Expiring</Badge>;
    case "expired":
      return <Badge variant="destructive">Expired</Badge>;
    case "missing":
      return <Badge variant="secondary">Missing</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export default function CoverageMatrix() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coverage Matrix</h1>
          <p className="text-muted-foreground">
            View insurance coverage status across all properties and coverage types
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Coverage
          </Button>
        </div>
      </div>

      {/* Coverage Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Coverage Overview Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Property</TableHead>
                  {coverageTypes.map((type) => (
                    <TableHead key={type} className="text-center min-w-[140px]">
                      {type}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {property}
                      </div>
                    </TableCell>
                    {coverageTypes.map((coverageType) => {
                      const coverage = mockCoverageData[property]?.[coverageType];
                      return (
                        <TableCell key={coverageType} className="text-center">
                          <div className="space-y-1">
                            {getStatusBadge(coverage?.status || "missing")}
                            {coverage?.limit && (
                              <div className="text-xs text-muted-foreground">
                                {coverage.limit}
                              </div>
                            )}
                            {coverage?.expiry && (
                              <div className="text-xs text-muted-foreground">
                                Exp: {coverage.expiry}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coverage Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">8</div>
            <p className="text-xs text-muted-foreground">
              Missing coverage across portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">4</div>
            <p className="text-xs text-muted-foreground">
              Policies expiring in 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Grid3X3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">16</div>
            <p className="text-xs text-muted-foreground">
              Currently active coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">
              Overall portfolio coverage
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}