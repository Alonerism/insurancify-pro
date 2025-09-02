import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Users, Search, Plus, MoreVertical, Building, Mail, Phone, Shield } from "lucide-react";

const mockContacts = [
  {
    id: 1,
    name: "Sarah Mitchell",
    company: "ABC Insurance Brokers",
    type: "broker",
    email: "sarah.mitchell@abcbrokers.com",
    phone: "(555) 123-4567",
    address: "123 Business Ave, Los Angeles, CA 90210",
    activePolicies: 12,
    totalPremium: "$125,000",
  },
  {
    id: 2,
    name: "John Smith",
    company: "State Farm Insurance",
    type: "carrier",
    email: "john.smith@statefarm.com",
    phone: "(555) 234-5678",
    address: "456 Insurance Blvd, Los Angeles, CA 90211",
    activePolicies: 8,
    totalPremium: "$95,000",
  },
  {
    id: 3,
    name: "Lisa Rodriguez",
    company: "Superior Claims Adjusters",
    type: "adjuster",
    email: "lisa.rodriguez@superiorclaims.com",
    phone: "(555) 345-6789",
    address: "789 Adjuster St, Los Angeles, CA 90212",
    activePolicies: 0,
    totalPremium: "$0",
  },
  {
    id: 4,
    name: "Michael Chen",
    company: "XYZ Risk Management",
    type: "broker",
    email: "michael.chen@xyzrisk.com",
    phone: "(555) 456-7890",
    address: "321 Risk Ave, Los Angeles, CA 90213",
    activePolicies: 6,
    totalPremium: "$75,000",
  },
  {
    id: 5,
    name: "Jennifer Davis",
    company: "Allstate Insurance",
    type: "carrier",
    email: "jennifer.davis@allstate.com",
    phone: "(555) 567-8901",
    address: "654 Carrier Way, Los Angeles, CA 90214",
    activePolicies: 5,
    totalPremium: "$110,000",
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "broker":
      return <Users className="h-4 w-4" />;
    case "carrier":
      return <Shield className="h-4 w-4" />;
    case "adjuster":
      return <Building className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};

const getTypeBadge = (type: string) => {
  const typeMap = {
    broker: { variant: "default" as const, text: "Broker" },
    carrier: { variant: "secondary" as const, text: "Carrier" },
    adjuster: { variant: "outline" as const, text: "Adjuster" },
    other: { variant: "outline" as const, text: "Other" },
  };
  
  const config = typeMap[type as keyof typeof typeMap] || { variant: "outline" as const, text: type };
  return <Badge variant={config.variant}>{config.text}</Badge>;
};

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredContacts = mockContacts.filter((contact) => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = activeTab === "all" || contact.type === activeTab;
    
    return matchesSearch && matchesType;
  });

  const contactsByType = {
    all: mockContacts.length,
    broker: mockContacts.filter(c => c.type === "broker").length,
    carrier: mockContacts.filter(c => c.type === "carrier").length,
    adjuster: mockContacts.filter(c => c.type === "adjuster").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">
            Manage brokers, carriers, adjusters, and other insurance contacts
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts by Type */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Contacts ({contactsByType.all})</TabsTrigger>
          <TabsTrigger value="broker">Brokers ({contactsByType.broker})</TabsTrigger>
          <TabsTrigger value="carrier">Carriers ({contactsByType.carrier})</TabsTrigger>
          <TabsTrigger value="adjuster">Adjusters ({contactsByType.adjuster})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {activeTab === "all" ? "All Contacts" : 
                 activeTab === "broker" ? "Insurance Brokers" :
                 activeTab === "carrier" ? "Insurance Carriers" : "Claims Adjusters"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company & Type</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Business Relationship</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {getTypeIcon(contact.type)}
                          </div>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.company}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contact.company}</div>
                          <div className="mt-1">
                            {getTypeBadge(contact.type)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                              {contact.phone}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.activePolicies > 0 ? (
                          <div>
                            <div className="text-sm font-medium">
                              {contact.activePolicies} Active Policies
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {contact.totalPremium} Total Premium
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No active policies
                          </div>
                        )}
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
                            <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                            <DropdownMenuItem>View Policies</DropdownMenuItem>
                            <DropdownMenuItem>Send Email</DropdownMenuItem>
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