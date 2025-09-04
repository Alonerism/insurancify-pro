import { useState } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BuildingTile } from "@/components/BuildingTile";
import { QuickViewDrawer } from "@/components/QuickViewDrawer";
import { mockBuildings, mockAgents, mockPolicies, coverageTypeLabels } from "@/data/mockData";
import { Building, Policy, Agent, CoverageType } from "@/types";

export default function AssignmentMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedPolicies, setSelectedPolicies] = useState<Policy[]>([]);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [highlightExpiring, setHighlightExpiring] = useState(false);
  
  // Dialog states
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  
  // Form states
  const [newBuilding, setNewBuilding] = useState({ name: "", address: "", primaryAgentId: "" });
  const [newAgent, setNewAgent] = useState({ name: "", company: "", email: "", phone: "" });
  const [newPolicy, setNewPolicy] = useState({ 
    buildingId: "", 
    agentId: "", 
    coverageType: "" as CoverageType, 
    policyNumber: "", 
    carrier: "", 
    effectiveDate: "", 
    expirationDate: "", 
    premiumAnnual: 0 
  });
  
  // Dynamic data (in real app, this would be in global state/database)
  const [buildings, setBuildings] = useState(mockBuildings);
  const [agents, setAgents] = useState(mockAgents);
  const [policies, setPolicies] = useState(mockPolicies);

  // Add handlers
  const handleAddBuilding = () => {
    if (newBuilding.name && newBuilding.address) {
      const building: Building = {
        id: `building-${Date.now()}`,
        name: newBuilding.name,
        address: newBuilding.address,
        primaryAgentId: newBuilding.primaryAgentId || undefined
      };
      setBuildings([...buildings, building]);
      setNewBuilding({ name: "", address: "", primaryAgentId: "" });
      setBuildingDialogOpen(false);
    }
  };

  const handleAddAgent = () => {
    if (newAgent.name && newAgent.company && newAgent.email) {
      const agent: Agent = {
        id: `agent-${Date.now()}`,
        name: newAgent.name,
        company: newAgent.company,
        email: newAgent.email,
        phone: newAgent.phone
      };
      setAgents([...agents, agent]);
      setNewAgent({ name: "", company: "", email: "", phone: "" });
      setAgentDialogOpen(false);
    }
  };

  const handleAddPolicy = () => {
    if (newPolicy.buildingId && newPolicy.agentId && newPolicy.coverageType && newPolicy.policyNumber) {
      const policy: Policy = {
        id: `policy-${Date.now()}`,
        buildingId: newPolicy.buildingId,
        agentId: newPolicy.agentId,
        coverageType: newPolicy.coverageType,
        policyNumber: newPolicy.policyNumber,
        carrier: newPolicy.carrier,
        effectiveDate: newPolicy.effectiveDate,
        expirationDate: newPolicy.expirationDate,
        limits: {},
        deductibles: {},
        premiumAnnual: newPolicy.premiumAnnual,
        status: 'active',
        documents: []
      };
      setPolicies([...policies, policy]);
      setNewPolicy({ 
        buildingId: "", 
        agentId: "", 
        coverageType: "" as CoverageType, 
        policyNumber: "", 
        carrier: "", 
        effectiveDate: "", 
        expirationDate: "", 
        premiumAnnual: 0 
      });
      setPolicyDialogOpen(false);
    }
  };

  // Group buildings by agent
  const getBuildingsByAgent = () => {
    const agentGroups: Record<string, Building[]> = {};
    
    // Initialize all agents with empty arrays
    agents.forEach(agent => {
      agentGroups[agent.id] = [];
    });
    
    // Add unassigned group
    agentGroups['unassigned'] = [];
    
    // Group buildings by their primary agent
    buildings.forEach(building => {
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
    return policies.filter(policy => policy.buildingId === buildingId);
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
  const filteredAgents = agents.filter((agent) =>
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
          <Dialog open={buildingDialogOpen} onOpenChange={setBuildingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Building
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Building</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="building-name">Building Name</Label>
                  <Input
                    id="building-name"
                    value={newBuilding.name}
                    onChange={(e) => setNewBuilding({...newBuilding, name: e.target.value})}
                    placeholder="Enter building name"
                  />
                </div>
                <div>
                  <Label htmlFor="building-address">Address</Label>
                  <Input
                    id="building-address"
                    value={newBuilding.address}
                    onChange={(e) => setNewBuilding({...newBuilding, address: e.target.value})}
                    placeholder="Enter building address"
                  />
                </div>
                <div>
                  <Label htmlFor="building-agent">Primary Agent (Optional)</Label>
                  <Select value={newBuilding.primaryAgentId} onValueChange={(value) => setNewBuilding({...newBuilding, primaryAgentId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddBuilding} className="w-full">Add Building</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="agent-name">Agent Name</Label>
                  <Input
                    id="agent-name"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                    placeholder="Enter agent name"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-company">Company</Label>
                  <Input
                    id="agent-company"
                    value={newAgent.company}
                    onChange={(e) => setNewAgent({...newAgent, company: e.target.value})}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-email">Email</Label>
                  <Input
                    id="agent-email"
                    type="email"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent({...newAgent, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-phone">Phone</Label>
                  <Input
                    id="agent-phone"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({...newAgent, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <Button onClick={handleAddAgent} className="w-full">Add Agent</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Policy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="policy-building">Building</Label>
                  <Select value={newPolicy.buildingId} onValueChange={(value) => setNewPolicy({...newPolicy, buildingId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map(building => (
                        <SelectItem key={building.id} value={building.id}>{building.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="policy-agent">Agent</Label>
                  <Select value={newPolicy.agentId} onValueChange={(value) => setNewPolicy({...newPolicy, agentId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="policy-coverage">Coverage Type</Label>
                  <Select value={newPolicy.coverageType} onValueChange={(value) => setNewPolicy({...newPolicy, coverageType: value as CoverageType})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coverage type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(coverageTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="policy-number">Policy Number</Label>
                  <Input
                    id="policy-number"
                    value={newPolicy.policyNumber}
                    onChange={(e) => setNewPolicy({...newPolicy, policyNumber: e.target.value})}
                    placeholder="Enter policy number"
                  />
                </div>
                <div>
                  <Label htmlFor="policy-carrier">Carrier</Label>
                  <Input
                    id="policy-carrier"
                    value={newPolicy.carrier}
                    onChange={(e) => setNewPolicy({...newPolicy, carrier: e.target.value})}
                    placeholder="Enter carrier name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="policy-effective">Effective Date</Label>
                    <Input
                      id="policy-effective"
                      type="date"
                      value={newPolicy.effectiveDate}
                      onChange={(e) => setNewPolicy({...newPolicy, effectiveDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="policy-expiration">Expiration Date</Label>
                    <Input
                      id="policy-expiration"
                      type="date"
                      value={newPolicy.expirationDate}
                      onChange={(e) => setNewPolicy({...newPolicy, expirationDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="policy-premium">Annual Premium</Label>
                  <Input
                    id="policy-premium"
                    type="number"
                    value={newPolicy.premiumAnnual}
                    onChange={(e) => setNewPolicy({...newPolicy, premiumAnnual: parseFloat(e.target.value) || 0})}
                    placeholder="Enter annual premium"
                  />
                </div>
                <Button onClick={handleAddPolicy} className="w-full">Add Policy</Button>
              </div>
            </DialogContent>
          </Dialog>
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
                        agents={agents.filter(a => a.id !== agent.id)}
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
                      agents={agents}
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