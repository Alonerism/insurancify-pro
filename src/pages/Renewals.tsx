import { useState, useMemo } from "react";
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
import { Calendar, Clock, Mail, MoreVertical, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { usePolicies } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";

interface RenewalPolicy {
  id: string;
  policyNumber: string;
  type: string;
  property: string;
  carrier: string;
  expirationDate: string;
  daysUntilExpiry: number;
  premium: string;
  status: string;
  priority: string;
}

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
  
  const { data: policies = [], isLoading, error } = usePolicies();

  // Transform policies into renewals with expiration tracking
  const renewals: RenewalPolicy[] = useMemo(() => {
    return policies
      .filter(policy => policy.expirationDate && policy.status === 'active')
      .map(policy => {
        const expirationDate = new Date(policy.expirationDate!);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: policy.id,
          policyNumber: policy.policyNumber || `POL-${policy.id}`,
          type: policy.coverageType || 'Unknown',
          property: `Property ${policy.buildingId || 'Unknown'}`,
          carrier: policy.carrier || 'Unknown',
          expirationDate: expirationDate.toLocaleDateString(),
          daysUntilExpiry,
          premium: policy.premiumAnnual ? `$${policy.premiumAnnual.toLocaleString()}` : '$0',
          status: daysUntilExpiry <= 0 ? 'expired' : daysUntilExpiry <= 30 ? 'expiring_soon' : 'active',
          priority: daysUntilExpiry <= 15 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'medium',
        };
      })
      .filter(renewal => renewal.daysUntilExpiry <= 180) // Only show renewals within 6 months
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [policies]);

  const windowOptions = useMemo(() => [
    { value: "15", label: "15 Days", count: filterByWindow(renewals, 15).length },
    { value: "30", label: "30 Days", count: filterByWindow(renewals, 30).length },
    { value: "60", label: "60 Days", count: filterByWindow(renewals, 60).length },
    { value: "90", label: "90 Days", count: filterByWindow(renewals, 90).length },
  ], [renewals]);

  const filteredRenewals = filterByWindow(renewals, parseInt(selectedWindow));

  const handleSendRenewalNotices = () => {
    toast({
      title: "Coming Soon",
      description: "Email renewal notices feature will be available soon.",
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load renewals</p>
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
          <h1 className="text-3xl font-bold text-foreground">Renewals</h1>
          <p className="text-muted-foreground">
            Track and manage policy renewals across your portfolio
          </p>
        </div>
        <Button onClick={handleSendRenewalNotices}>
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
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredRenewals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No policies expiring in the next {selectedWindow} days</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Carrier</TableHead>
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
                          <div className="font-medium">{renewal.carrier}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{renewal.expirationDate}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {renewal.daysUntilExpiry > 0 ? `${renewal.daysUntilExpiry} days left` : 'Expired'}
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
                              <DropdownMenuItem onClick={() => toast({ title: "Coming Soon", description: "View policy feature coming soon" })}>
                                View Policy
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: "Coming Soon", description: "Send renewal notice feature coming soon" })}>
                                Send Renewal Notice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: "Coming Soon", description: "Request quote feature coming soon" })}>
                                Request Quote
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: "Coming Soon", description: "Mark as renewed feature coming soon" })}>
                                Mark as Renewed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}