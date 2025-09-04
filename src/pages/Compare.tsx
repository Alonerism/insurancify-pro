import { useState } from "react";
import { ArrowLeftRight, Download, Save, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockPolicies, mockBuildings, coverageTypeLabels } from "@/data/mockData";
import { Policy, PolicyComparison, PolicyDifference } from "@/types";

export default function Compare() {
  const [compareMode, setCompareMode] = useState<'building' | 'policy' | 'prospective'>('policy');
  const [selectedPolicyA, setSelectedPolicyA] = useState<string>('');
  const [selectedPolicyB, setSelectedPolicyB] = useState<string>('');
  const [selectedBuildingA, setSelectedBuildingA] = useState<string>('');
  const [selectedBuildingB, setSelectedBuildingB] = useState<string>('');
  const [prospectivePolicy, setProspectivePolicy] = useState({
    buildingId: '',
    coverageType: 'general-liability' as const,
    carrier: '',
    limits: { aggregate: 0, occurrence: 0 },
    deductibles: { general: 0 },
    premiumAnnual: 0,
    effectiveDate: '',
    expirationDate: ''
  });
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ question: string; answer: string }>>([]);

  const getPolicyById = (id: string): Policy | undefined => {
    return mockPolicies.find(p => p.id === id);
  };

  const getBuildingName = (buildingId: string) => {
    return mockBuildings.find(b => b.id === buildingId)?.name || "Unknown Building";
  };

  const generateDetailedComparison = (): PolicyComparison | null => {
    let policyA: Policy | undefined;
    let policyB: Policy | undefined;

    if (compareMode === 'policy') {
      policyA = getPolicyById(selectedPolicyA);
      policyB = getPolicyById(selectedPolicyB);
    } else if (compareMode === 'building') {
      // Find policies for selected buildings
      const policiesA = mockPolicies.filter(p => p.buildingId === selectedBuildingA);
      const policiesB = mockPolicies.filter(p => p.buildingId === selectedBuildingB);
      policyA = policiesA[0];
      policyB = policiesB[0];
    } else {
      // Prospective mode
      const matchingPolicies = mockPolicies.filter(p => 
        p.buildingId === prospectivePolicy.buildingId && 
        p.coverageType === prospectivePolicy.coverageType
      );
      
      if (matchingPolicies.length === 0) return null;
      
      policyB = matchingPolicies[0];
      return {
        policyA: prospectivePolicy,
        policyB,
        differences: generateDifferences(prospectivePolicy, policyB),
        regressions: [],
        improvements: []
      };
    }

    if (!policyA || !policyB) return null;

    return {
      policyA,
      policyB,
      differences: generateDifferences(policyA, policyB),
      regressions: [],
      improvements: []
    };
  };

  const generateDifferences = (policyA: Policy | any, policyB: Policy): PolicyDifference[] => {
    return [
      {
        field: 'Premium',
        valueA: policyA.premiumAnnual,
        valueB: policyB.premiumAnnual,
        type: (policyA.premiumAnnual > policyB.premiumAnnual ? 'regression' : 'improvement') as 'regression' | 'improvement'
      },
      {
        field: 'Carrier',
        valueA: policyA.carrier,
        valueB: policyB.carrier,
        type: 'neutral' as const
      },
      {
        field: 'Effective Date',
        valueA: policyA.effectiveDate,
        valueB: policyB.effectiveDate,
        type: 'neutral' as const
      },
      {
        field: 'Expiration Date',
        valueA: policyA.expirationDate,
        valueB: policyB.expirationDate,
        type: 'neutral' as const
      }
    ];
  };

  const handleAskQuestion = () => {
    if (!chatQuestion.trim()) return;
    const mockResponse = {
      question: chatQuestion,
      answer: `Comparing these two policies, the key differences include premium costs, coverage limits, and deductibles. The first policy offers different terms that may be more suitable depending on your specific risk profile and coverage needs.`
    };
    setChatHistory([...chatHistory, mockResponse]);
    setChatQuestion("");
  };

  const comparison = generateDetailedComparison();
  const fitScore = comparison ? Math.floor(Math.random() * 40 + 60) : 0; // Mock score

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Policy Comparison</h1>
            <p className="text-muted-foreground">
              Compare existing policies or evaluate prospective coverage
            </p>
          </div>
        </div>

        <Tabs value={compareMode} onValueChange={(value) => setCompareMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="building">Building ↔ Building</TabsTrigger>
            <TabsTrigger value="policy">Policy ↔ Policy</TabsTrigger>
            <TabsTrigger value="prospective">Prospective ↔ Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="building" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Buildings to Compare</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Building A</Label>
                  <Select value={selectedBuildingA} onValueChange={setSelectedBuildingA}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select first building" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBuildings.map(building => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Building B</Label>
                  <Select value={selectedBuildingB} onValueChange={setSelectedBuildingB}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select second building" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBuildings.map(building => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Policies to Compare</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Policy A</Label>
                  <Select value={selectedPolicyA} onValueChange={setSelectedPolicyA}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select first policy" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPolicies.map(policy => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.policyNumber} - {getBuildingName(policy.buildingId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Policy B</Label>
                  <Select value={selectedPolicyB} onValueChange={setSelectedPolicyB}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select second policy" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPolicies.map(policy => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.policyNumber} - {getBuildingName(policy.buildingId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prospective" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prospective Policy Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Building</Label>
                  <Select 
                    value={prospectivePolicy.buildingId} 
                    onValueChange={(value) => setProspectivePolicy({...prospectivePolicy, buildingId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBuildings.map(building => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Carrier</Label>
                  <Input 
                    value={prospectivePolicy.carrier}
                    onChange={(e) => setProspectivePolicy({...prospectivePolicy, carrier: e.target.value})}
                    placeholder="Enter carrier name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Annual Premium</Label>
                  <Input 
                    type="number"
                    value={prospectivePolicy.premiumAnnual}
                    onChange={(e) => setProspectivePolicy({...prospectivePolicy, premiumAnnual: Number(e.target.value)})}
                    placeholder="Enter annual premium"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-6">
            {/* Fit Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Comparison Fit Score
                  <Badge variant={fitScore >= 80 ? 'default' : fitScore >= 60 ? 'secondary' : 'destructive'}>
                    {fitScore}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${fitScore}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on limits (40%), deductibles (25%), exclusions (20%), endorsements (10%), and timing (5%)
                </p>
              </CardContent>
            </Card>

            {/* Detailed Comparison Sections */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Policy A */}
              <Card>
                <CardHeader>
                  <CardTitle>Policy A</CardTitle>
                </CardHeader>
                <CardContent>
                  {'policyNumber' in comparison.policyA ? (
                    <div className="space-y-2">
                      <div><strong>Policy #:</strong> {comparison.policyA.policyNumber}</div>
                      <div><strong>Building:</strong> {getBuildingName(comparison.policyA.buildingId)}</div>
                      <div><strong>Carrier:</strong> {comparison.policyA.carrier}</div>
                      <div><strong>Coverage:</strong> {coverageTypeLabels[comparison.policyA.coverageType]}</div>
                      <div><strong>Premium:</strong> ${comparison.policyA.premiumAnnual.toLocaleString()}</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div><strong>Type:</strong> Prospective Policy</div>
                      <div><strong>Building:</strong> {getBuildingName(comparison.policyA.buildingId)}</div>
                      <div><strong>Carrier:</strong> {comparison.policyA.carrier}</div>
                      <div><strong>Coverage:</strong> {coverageTypeLabels[comparison.policyA.coverageType]}</div>
                      <div><strong>Premium:</strong> ${comparison.policyA.premiumAnnual.toLocaleString()}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Policy B */}
              <Card>
                <CardHeader>
                  <CardTitle>Policy B</CardTitle>
                </CardHeader>
                <CardContent>
                  {'policyNumber' in comparison.policyB && (
                    <div className="space-y-2">
                      <div><strong>Policy #:</strong> {comparison.policyB.policyNumber}</div>
                      <div><strong>Building:</strong> {getBuildingName(comparison.policyB.buildingId)}</div>
                      <div><strong>Carrier:</strong> {comparison.policyB.carrier}</div>
                      <div><strong>Coverage:</strong> {coverageTypeLabels[comparison.policyB.coverageType]}</div>
                      <div><strong>Premium:</strong> ${comparison.policyB.premiumAnnual.toLocaleString()}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Differences Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Differences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparison.differences.map((diff, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-3 border rounded">
                      <div className="font-medium">{diff.field}</div>
                      <div className={diff.type === 'improvement' ? 'text-green-600' : diff.type === 'regression' ? 'text-red-600' : ''}>
                        {typeof diff.valueA === 'number' ? diff.valueA.toLocaleString() : diff.valueA}
                      </div>
                      <div className={diff.type === 'regression' ? 'text-green-600' : diff.type === 'improvement' ? 'text-red-600' : ''}>
                        {typeof diff.valueB === 'number' ? diff.valueB.toLocaleString() : diff.valueB}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Panel */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Ask AI about Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What are the key differences between these policies?"
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
            />
            <Button onClick={handleAskQuestion} className="w-full">
              Ask Question
            </Button>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {chatHistory.map((chat, index) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <div className="text-sm font-medium">Q: {chat.question}</div>
                  <div className="text-sm text-muted-foreground">A: {chat.answer}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}