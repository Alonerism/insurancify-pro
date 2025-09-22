import { useState } from "react";
import { MessageSquare, FileText, Edit, Plus, Eye, ArrowLeftRight, Upload, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { coverageTypeLabels } from "@/data/mockData";
import { Policy } from "@/types";
import { usePolicies, useBuildings, useAgents, usePolicyHistory, useFileUpload, useAddPolicyNote, useSearchPolicies } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";

export default function Policies() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [newNote, setNewNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Filter state uses 'all' sentinel instead of empty string because Radix Select disallows empty string values
  const ALL = 'all';
  const [filterAgent, setFilterAgent] = useState<string>(ALL);
  const [filterBuilding, setFilterBuilding] = useState<string>(ALL);
  const [filterStatus, setFilterStatus] = useState<string>(ALL);
  const [uploadingFile, setUploadingFile] = useState(false);

  // API Hooks
  const { data: policies = [], isLoading: policiesLoading, error: policiesError } = usePolicies();
  const { data: buildings = [] } = useBuildings();
  const { data: agents = [] } = useAgents();
  const { data: searchResults = [] } = useSearchPolicies(searchTerm);
  
  const policyHistoryQuery = usePolicyHistory(selectedPolicy?.id || '');
  const fileUploadMutation = useFileUpload();
  const addNoteMutation = useAddPolicyNote();

  const getBuildingName = (buildingId: string) => buildings.find(b => b.id === buildingId)?.name || "Unknown Building";
  const getAgentName = (agentId: string) => agents.find(a => a.id === agentId)?.name || "Unknown Agent";

  // Filter policies
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = !searchTerm || 
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBuildingName(policy.buildingId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgent = filterAgent === ALL || policy.agentId === filterAgent;
    const matchesBuilding = filterBuilding === ALL || policy.buildingId === filterBuilding;
    const matchesStatus = filterStatus === ALL || policy.status === filterStatus;
    
    return matchesSearch && matchesAgent && matchesBuilding && matchesStatus;
  });

  const handleAskQuestion = () => {
    if (!chatQuestion.trim()) return;
    const mockResponse = {
      question: chatQuestion,
      answer: `Based on policy ${selectedPolicy?.policyNumber}, the coverage includes ${coverageTypeLabels[selectedPolicy?.coverageType || 'general-liability']} with limits and deductibles as specified. The policy is managed by ${getAgentName(selectedPolicy?.agentId || '')}.`
    };
    setChatHistory([...chatHistory, mockResponse]);
    setChatQuestion("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPolicy) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('building_id', selectedPolicy.buildingId);
    formData.append('policy_id', selectedPolicy.id);
    
    try {
      const result = await fileUploadMutation.mutateAsync(formData);
      toast({
        title: 'File uploaded successfully',
        description: result.message,
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedPolicy) return;
    
    await addNoteMutation.mutateAsync({
      policyId: selectedPolicy.id,
      note: newNote,
    });
    
    setNewNote("");
  };

  if (policiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading policies...</span>
      </div>
    );
  }

  if (policiesError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive">Unable to load policies</h3>
              <p className="text-muted-foreground mt-2">
                Please check your backend connection and try again.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policies</h1>
          <p className="text-muted-foreground">Manage and view all insurance policies</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add Policy</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Filter by Agent</Label>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
          <SelectItem value={ALL}>All agents</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filter by Building</Label>
        <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                <SelectTrigger>
                  <SelectValue placeholder="All buildings" />
                </SelectTrigger>
                <SelectContent>
          <SelectItem value={ALL}>All buildings</SelectItem>
                  {buildings.map(building => (
                    <SelectItem key={building.id} value={building.id}>{building.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filter by Status</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{policy.policyNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {getBuildingName(policy.buildingId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Agent: {getAgentName(policy.agentId)}
                  </p>
                </div>
                <StatusBadge status={policy.status} />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Policy Details */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Coverage</span>
                  <Badge variant="secondary" className="text-xs">
                    {coverageTypeLabels[policy.coverageType]}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Carrier</span>
                  <span className="text-sm text-muted-foreground">{policy.carrier}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Premium</span>
                  <span className="text-sm font-medium">${(policy.premiumAnnual ?? 0).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expires</span>
                  <span className="text-sm text-muted-foreground">
                    {policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm">
                  <ArrowLeftRight className="h-3 w-3" />
                </Button>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedPolicy(policy)}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[600px]">
                    <SheetHeader>
                      <SheetTitle>Policy Details - {policy.policyNumber}</SheetTitle>
                      <SheetDescription>Manage policy information and history</SheetDescription>
                    </SheetHeader>
                    
                    <Tabs defaultValue="chat" className="mt-6">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="chat">Q&A</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="files">Files</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="chat" className="space-y-4">
                        <Textarea
                          placeholder="What are the coverage limits?"
                          value={chatQuestion}
                          onChange={(e) => setChatQuestion(e.target.value)}
                        />
                        <Button onClick={handleAskQuestion} className="w-full">Ask Question</Button>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {chatHistory.map((chat, index) => (
                            <div key={index} className="p-3 border rounded-lg space-y-2">
                              <div className="text-sm font-medium">Q: {chat.question}</div>
                              <div className="text-sm text-muted-foreground">A: {chat.answer}</div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="history" className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Add a note about this policy..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              onClick={handleAddNote}
                              disabled={addNoteMutation.isPending || !newNote.trim()}
                            >
                              {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </div>
                          
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {policyHistoryQuery.data?.map((item: any, index: number) => (
                              <div key={item.id || index} className="p-3 border rounded-lg">
                                <div className="text-sm">{item.note}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(item.created_at).toLocaleString()}
                                </div>
                                {item.file && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    📎 {item.file.original_filename}
                                  </div>
                                )}
                              </div>
                            ))}
                            {policyHistoryQuery.isLoading && (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="files" className="space-y-4">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            {uploadingFile ? (
                              <Loader2 className="h-8 w-8 mx-auto animate-spin" />
                            ) : (
                              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            )}
                            <p className="text-sm font-medium">
                              {uploadingFile ? 'Uploading...' : 'Click to upload files'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, DOC, DOCX up to 10MB
                            </p>
                          </label>
                        </div>
                        
                        <div className="space-y-2">
                          {selectedPolicy?.documents?.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{doc}</span>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
  {filteredPolicies.length === 0 && !policiesLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No policies found</h3>
                <p className="text-muted-foreground">
      {searchTerm || (filterAgent !== ALL) || (filterBuilding !== ALL) || (filterStatus !== ALL) ? 
                    'Try adjusting your filters' : 
                    'Get started by adding your first policy'
                  }
                </p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}