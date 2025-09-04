import { useState } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { BuildingTile } from "@/components/BuildingTile";
import { QuickViewDrawer } from "@/components/QuickViewDrawer";
import { mockBuildings, mockAgents, mockPolicies } from "@/data/mockData";
import { Building, Policy } from "@/types";

export default function AssignmentMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedPolicies, setSelectedPolicies] = useState<Policy[]>([]);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [highlightExpiring, setHighlightExpiring] = useState(false);

  // Group buildings by agent
  const getBuildingsByAgent = () => {
    const agentGroups: Record<string, Building[]> = {};
    
    // Initialize all agents with empty arrays
    mockAgents.forEach(agent => {
      agentGroups[agent.id] = [];
    });
    
    // Add unassigned group
    agentGroups['unassigned'] = [];
    
    // Group buildings by their primary agent
    mockBuildings.forEach(building => {
      const agentId = building.primaryAgentId || 'unassigned';
      if (!agentGroups[agentId]) {
        agentGroups[agentId] = [];
      }
      agentGroups[agentId].push(building);
    });
    
    return agentGroups;
  };

  // Get policies for a building
  const getPoliciesForBuilding = (buildingId: string): Policy[] => {
    return mockPolicies.filter(policy => policy.buildingId === buildingId);
  };

  // Check if building has policies expiring in next 60 days
  const isBuildingExpiring = (buildingId: string): boolean => {
    const policies = getPoliciesForBuilding(buildingId);
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    
    return policies.some(policy => {
      const expirationDate = new Date(policy.expirationDate);
      return expirationDate <= sixtyDaysFromNow && expirationDate > now;
    });
  };

  // Filter agents based on search
  const filteredAgents = mockAgents.filter((agent) =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuildingClick = (building: Building, policies: Policy[]) => {
    setSelectedBuilding(building);
    setSelectedPolicies(policies);
    setQuickViewOpen(true);
  };

  const handleBuildingMove = (buildingId: string, newAgentId: string) => {
    // In a real app, this would make an API call
    console.log(`Moving building ${buildingId} to agent ${newAgentId}`);
    // Mock update - in real app would update the building's primaryAgentId
  };

  const handleDrop = (e: React.DragEvent, agentId: string) => {
    e.preventDefault();
    const buildingId = e.dataTransfer.getData('text/plain');
    handleBuildingMove(buildingId, agentId);
  };

  const buildingsByAgent = getBuildingsByAgent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignment Board</h1>
          <p className="text-muted-foreground">
            Drag buildings between agents to reassign coverage
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
                  placeholder="Search buildings, agents, or policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button 
              variant={highlightExpiring ? "default" : "outline"}
              onClick={() => setHighlightExpiring(!highlightExpiring)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Expiring Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
          {/* Agent Columns */}
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="w-80 flex-shrink-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{agent.company}</p>
                </CardHeader>
                <CardContent
                  className="min-h-[400px] space-y-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, agent.id)}
                >
                  {buildingsByAgent[agent.id]?.map((building) => {
                    const policies = getPoliciesForBuilding(building.id);
                    const isExpiring = highlightExpiring && isBuildingExpiring(building.id);
                    return (
                      <BuildingTile
                        key={building.id}
                        building={building}
                        policies={policies}
                        agents={mockAgents.filter(a => a.id !== agent.id)}
                        onMove={handleBuildingMove}
                        onClick={handleBuildingClick}
                        isExpiring={isExpiring}
                      />
                    );
                  })}
                  
                  {(!buildingsByAgent[agent.id] || buildingsByAgent[agent.id].length === 0) && (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No buildings assigned
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Unassigned Column */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Unassigned</CardTitle>
                <p className="text-sm text-muted-foreground">No agent assigned</p>
              </CardHeader>
              <CardContent
                className="min-h-[400px] space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'unassigned')}
              >
                {buildingsByAgent['unassigned']?.map((building) => {
                  const policies = getPoliciesForBuilding(building.id);
                  const isExpiring = highlightExpiring && isBuildingExpiring(building.id);
                  return (
                    <BuildingTile
                      key={building.id}
                      building={building}
                      policies={policies}
                      agents={mockAgents}
                      onMove={handleBuildingMove}
                      onClick={handleBuildingClick}
                      isExpiring={isExpiring}
                    />
                  );
                })}
                
                {(!buildingsByAgent['unassigned'] || buildingsByAgent['unassigned'].length === 0) && (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      All buildings assigned
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <QuickViewDrawer
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        building={selectedBuilding}
        policies={selectedPolicies}
      />
    </div>
  );
}