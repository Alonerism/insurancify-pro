import { useState } from "react";
import { MessageSquare, Edit, ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Building, Policy } from "@/types";
import { coverageTypeLabels } from "@/data/mockData";
import { useAgents } from "@/hooks/useApi";

interface QuickViewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: Building | null;
  policies: Policy[];
}

export function QuickViewDrawer({ open, onOpenChange, building, policies }: QuickViewDrawerProps) {
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [showChat, setShowChat] = useState(false);
  // Hooks must run unconditionally
  const { data: agents = [] } = useAgents();

  if (!building) return null;
  const primaryPolicy = policies.length > 0 ? policies[0] : null;
  const agent = primaryPolicy ? agents.find(a => a.id === primaryPolicy.agentId) : null;

  const handleAskQuestion = () => {
    if (!chatQuestion.trim()) return;
    const mockResponse = {
      question: chatQuestion,
      answer: `Based on the policies for ${building.name}, this property has ${policies.length} active policies covering ${coverageTypeLabels[primaryPolicy?.coverageType || 'general-liability']} and other coverage types.`
    };
    setChatHistory([...chatHistory, mockResponse]);
    setChatQuestion("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{building.name}</SheetTitle>
              <SheetDescription>{building.address}</SheetDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Building Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium">Primary Agent</div>
                <div className="text-sm text-muted-foreground">
                  {agent ? `${agent.name} - ${agent.company}` : 'No agent assigned'}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Active Policies</div>
                <div className="text-sm text-muted-foreground">
                  {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
                </div>
              </div>

              {building.notes && (
                <div>
                  <div className="text-sm font-medium">Notes</div>
                  <div className="text-sm text-muted-foreground">{building.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policies */}
          {policies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {policies.map(policy => (
                  <div key={policy.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{policy.policyNumber}</span>
                        <StatusBadge status={policy.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {coverageTypeLabels[policy.coverageType]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {policy.carrier}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expires: {new Date(policy.expirationDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" className="flex-1">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Compare
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask AI
            </Button>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ask AI about {building.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="What are the coverage details for this property?"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                />
                <Button onClick={handleAskQuestion} className="w-full">
                  Ask Question
                </Button>
                {chatHistory.map((chat, index) => (
                  <div key={index} className="p-3 border rounded space-y-2">
                    <div className="text-sm font-medium">Q: {chat.question}</div>
                    <div className="text-sm text-muted-foreground">A: {chat.answer}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}