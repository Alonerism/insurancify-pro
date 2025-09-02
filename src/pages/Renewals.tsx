import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Calendar, Clock, Mail, MoreVertical, Shield, AlertTriangle } from "lucide-react";

const mockRenewals = [
  {
    id: 1,
    policyNumber: "UMB-2024-003",
    type: "Umbrella",
    property: "Oak Tower Building",
    carrier: "Travelers",
    expirationDate: "2024-03-15",
    daysUntilExpiry: 15,
    premium: "$8,200",
    status: "pending_renewal",
    broker: "ABC Insurance Brokers",
    priority: "high",
  },
  {
    id: 2,
    policyNumber: "WC-2024-004",
    type: "Workers' Comp",
    property: "Riverside Apartments",
    carrier: "Hartford",
    expirationDate: "2024-03-30",
    daysUntilExpiry: 30,
    premium: "$15,500",
    status: "quote_requested",
    broker: "XYZ Risk Management",
    priority: "high",
  },
  {
    id: 3,
    policyNumber: "GL-2024-005",
    type: "General Liability",
    property: "Downtown Plaza",
    carrier: "Liberty Mutual",
    expirationDate: "2024-04-20",
    daysUntilExpiry: 51,
    premium: "$22,000",
    status: "renewal_notice_sent",
    broker: "ABC Insurance Brokers",
    priority: "medium",
  },
  {
    id: 4,
    policyNumber: "PROP-2024-006",
    type: "Property Insurance",
    property: "Sunset Mall",
    carrier: "Zurich",
    expirationDate: "2024-05-15",
    daysUntilExpiry: 76,
    premium: "$65,000",
    status: "pending_renewal",
    broker: "Premium Risk Solutions",
    priority: "medium",
  },
];

const filterByWindow = (renewals: any[], window: number) => {
  return renewals.filter(renewal => renewal.daysUntilExpiry <= window);
};

const getStatusBadge = (status: string) => {
  const statusMap = {
    pending_renewal: { variant: "secondary" as const, text: "Pending" },
    quote_requested: { variant: "outline" as const, text: "Quote Requested" },
    renewal_notice_sent: { variant: "outline" as const, text: "Notice Sent" },
    renewed: { variant: "outline" as const, text: "Renewed" },
  };
  
  const config = statusMap[status as keyof typeof statusMap] || { variant: "secondary" as const, text: status };
  return <Badge variant={config.variant}>{config.text}</Badge>;
};

const getPriorityBadge = (priority: string, daysUntilExpiry: number) => {
  if (daysUntilExpiry <= 15) {
    return <Badge variant="destructive">Critical</Badge>;
  }
  if (daysUntilExpiry <= 30) {
    return <Badge variant="destructive">High</Badge>;
  }
  if (daysUntilExpiry <= 60) {
    return <Badge variant="secondary">Medium</Badge>;
  }
  return <Badge variant="outline">Low</Badge>;
};

export default function Renewals() {
  const [selectedWindow, setSelectedWindow] = useState("30");

  const windowOptions = [
    { value: "15", label: "15 Days", count: filterByWindow(mockRenewals, 15).length },
    { value: "30", label: "30 Days", count: filterByWindow(mockRenewals, 30).length },
    { value: "60", label: "60 Days", count: filterByWindow(mockRenewals, 60).length },
    { value: "90", label: "90 Days", count: filterByWindow(mockRenewals, 90).length },
  ];

  const filteredRenewals = filterByWindow(mockRenewals, parseInt(selectedWindow));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Renewals</h1>
          <p className="text-muted-foreground">
            Track and manage policy renewals across your portfolio
          </p>
        </div>
        <Button>
          <Mail className="mr-2 h-4 w-4" />
          Send Renewal Notices
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {windowOptions.map((option) => (
          <Card 
            key={option.value}
            className={`cursor-pointer transition-colors ${
              selectedWindow === option.value ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedWindow(option.value)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{option.label}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{option.count}</div>
              <p className="text-xs text-muted-foreground">
                Policies expiring
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Renewals Timeline */}
      <Tabs value={selectedWindow} onValueChange={setSelectedWindow}>
        <TabsList>
          <TabsTrigger value="15">Next 15 Days</TabsTrigger>
          <TabsTrigger value="30">Next 30 Days</TabsTrigger>
          <TabsTrigger value="60">Next 60 Days</TabsTrigger>
          <TabsTrigger value="90">Next 90 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedWindow} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Renewals - Next {selectedWindow} Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Carrier & Broker</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRenewals.map((renewal) => (
                    <TableRow key={renewal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{renewal.policyNumber}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {renewal.type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{renewal.property}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{renewal.carrier}</div>
                          <div className="text-sm text-muted-foreground">{renewal.broker}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{renewal.expirationDate}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {renewal.daysUntilExpiry} days left
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{renewal.premium}</TableCell>
                      <TableCell>
                        {getPriorityBadge(renewal.priority, renewal.daysUntilExpiry)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(renewal.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Policy</DropdownMenuItem>
                            <DropdownMenuItem>Send Renewal Notice</DropdownMenuItem>
                            <DropdownMenuItem>Request Quote</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Renewed</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}