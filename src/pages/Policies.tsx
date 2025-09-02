import { useState } from "react";
import { MessageSquare, FileText, Edit, Plus } from "lucide-react";
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
      answer: `Based on policy ${selectedPolicy?.policyNumber}, the coverage includes ${coverageTypeLabels[selectedPolicy?.coverageType || 'general-liability']} with limits and deductibles as specified.`
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

      <div className="grid gap-4">
        {mockPolicies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{policy.policyNumber}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getBuildingName(policy.buildingId)} • {getAgentName(policy.agentId)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={policy.status} />
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPolicy(policy)}>
                        <MessageSquare className="mr-2 h-4 w-4" />Ask AI
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
                        {chatHistory.map((chat, index) => (
                          <div key={index} className="p-3 border rounded space-y-2">
                            <div className="text-sm font-medium">Q: {chat.question}</div>
                            <div className="text-sm text-muted-foreground">A: {chat.answer}</div>
                          </div>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium">Coverage</div>
                  <Badge variant="secondary">{coverageTypeLabels[policy.coverageType]}</Badge>
                </div>
                <div>
                  <div className="text-sm font-medium">Carrier</div>
                  <div className="text-sm text-muted-foreground">{policy.carrier}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Premium</div>
                  <div className="text-sm text-muted-foreground">${policy.premiumAnnual.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}