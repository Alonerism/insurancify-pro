import { useState } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockBuildings, mockAgents, mockPolicies, coverageTypeLabels } from "@/data/mockData";
import { Building, Agent, Policy } from "@/types";

export default function AssignmentMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Get policies for a specific building-agent combination
  const getPoliciesForCell = (buildingId: string, agentId: string): Policy[] => {
    return mockPolicies.filter(
      (policy) => policy.buildingId === buildingId && policy.agentId === agentId
    );
  };

  // Filter agents based on search
  const filteredAgents = mockAgents.filter((agent) =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PolicyCell = ({ building, agent }: { building: Building; agent: Agent }) => {
    const policies = getPoliciesForCell(building.id, agent.id);
    
    if (policies.length === 0) {
      return (
        <div className="min-h-[80px] border-r border-b p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full h-full border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Policy
          </Button>
        </div>
      );
    }

    return (
      <div className="min-h-[80px] border-r border-b p-2 space-y-1">
        {policies.map((policy) => (
          <div key={policy.id} className="p-2 bg-muted rounded border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{policy.policyNumber}</span>
              <StatusBadge status={policy.status} />
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {coverageTypeLabels[policy.coverageType]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(policy.expirationDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignment Matrix</h1>
          <p className="text-muted-foreground">
            Manage policy assignments across buildings and agents
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Building
          </Button>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents or companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Coverage Type
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Expiring Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matrix */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <div className="grid min-w-max" style={{ gridTemplateColumns: `250px repeat(${filteredAgents.length}, 200px)` }}>
              {/* Header row */}
              <div className="sticky left-0 bg-background border-r border-b p-4 font-medium z-10">
                Building / Agent
              </div>
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="border-b p-3 text-center">
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">{agent.company}</div>
                </div>
              ))}

              {/* Matrix rows */}
              {mockBuildings.map((building) => (
                <div key={building.id} className="contents">
                  {/* Building name (sticky left column) */}
                  <div className="sticky left-0 bg-background border-r border-b p-4 z-10">
                    <div className="font-medium">{building.name}</div>
                    <div className="text-sm text-muted-foreground">{building.address}</div>
                  </div>
                  
                  {/* Policy cells for each agent */}
                  {filteredAgents.map((agent) => (
                    <PolicyCell key={`${building.id}-${agent.id}`} building={building} agent={agent} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}