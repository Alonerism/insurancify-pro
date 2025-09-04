import { useState } from "react";
import { MessageSquare, FileText, Edit, Plus, Eye, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { mockPolicies, mockBuildings, mockAgents, coverageTypeLabels } from "@/data/mockData";
import { Policy } from "@/types";

export default function Policies() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ question: string; answer: string }>>([]);

  const getBuildingName = (buildingId: string) => mockBuildings.find(b => b.id === buildingId)?.name || "Unknown Building";
  const getAgentName = (agentId: string) => mockAgents.find(a => a.id === agentId)?.name || "Unknown Agent";

  const handleAskQuestion = () => {
    if (!chatQuestion.trim()) return;
    const mockResponse = {
      question: chatQuestion,
      answer: `Based on policy ${selectedPolicy?.policyNumber}, the coverage includes ${coverageTypeLabels[selectedPolicy?.coverageType || 'general-liability']} with limits and deductibles as specified. The policy is managed by ${getAgentName(selectedPolicy?.agentId || '')}.`
    };
    setChatHistory([...chatHistory, mockResponse]);
    setChatQuestion("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policies</h1>
          <p className="text-muted-foreground">Manage and view all insurance policies</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add Policy</Button>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockPolicies.map((policy) => (
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
                  <span className="text-sm font-medium">${policy.premiumAnnual.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expires</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(policy.expirationDate).toLocaleDateString()}
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
                  <SheetContent className="w-[500px]">
                    <SheetHeader>
                      <SheetTitle>Policy Q&A - {policy.policyNumber}</SheetTitle>
                      <SheetDescription>Ask questions about this policy</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
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
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mockPolicies.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No policies found</h3>
                <p className="text-muted-foreground">Get started by adding your first policy</p>
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