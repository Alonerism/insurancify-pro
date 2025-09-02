import { useState } from "react";
import { ArrowLeftRight, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockPolicies, mockBuildings, coverageTypeLabels } from "@/data/mockData";
import { Policy, PolicyComparison } from "@/types";

export default function Compare() {
  const [compareMode, setCompareMode] = useState<'existing' | 'prospective'>('existing');
  const [selectedPolicyA, setSelectedPolicyA] = useState<string>('');
  const [selectedPolicyB, setSelectedPolicyB] = useState<string>('');
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

  const getPolicyById = (id: string): Policy | undefined => {
    return mockPolicies.find(p => p.id === id);
  };

  const getBuildingName = (buildingId: string) => {
    return mockBuildings.find(b => b.id === buildingId)?.name || "Unknown Building";
  };

  const generateComparison = (): PolicyComparison | null => {
    if (compareMode === 'existing') {
      const policyA = getPolicyById(selectedPolicyA);
      const policyB = getPolicyById(selectedPolicyB);
      if (!policyA || !policyB) return null;

      return {
        policyA,
        policyB,
        differences: [
          {
            field: 'Premium',
            valueA: policyA.premiumAnnual,
            valueB: policyB.premiumAnnual,
            type: policyA.premiumAnnual > policyB.premiumAnnual ? 'regression' : 'improvement'
          },
          {
            field: 'Aggregate Limit',
            valueA: policyA.limits.aggregate,
            valueB: policyB.limits.aggregate,
            type: (policyA.limits.aggregate || 0) < (policyB.limits.aggregate || 0) ? 'improvement' : 'regression'
          }
        ],
        regressions: policyA.premiumAnnual > policyB.premiumAnnual ? ['Higher premium cost'] : [],
        improvements: policyA.premiumAnnual < policyB.premiumAnnual ? ['Lower premium cost'] : []
      };
    } else {
      // Find best match for prospective policy
      const matchingPolicies = mockPolicies.filter(p => 
        p.buildingId === prospectivePolicy.buildingId && 
        p.coverageType === prospectivePolicy.coverageType
      );
      
      if (matchingPolicies.length === 0) return null;
      
      const bestMatch = matchingPolicies[0];
      return {
        policyA: prospectivePolicy,
        policyB: bestMatch,
        differences: [
          {
            field: 'Premium',
            valueA: prospectivePolicy.premiumAnnual,
            valueB: bestMatch.premiumAnnual,
            type: prospectivePolicy.premiumAnnual > bestMatch.premiumAnnual ? 'regression' : 'improvement'
          }
        ],
        regressions: prospectivePolicy.premiumAnnual > bestMatch.premiumAnnual ? ['Higher premium cost'] : [],
        improvements: prospectivePolicy.premiumAnnual < bestMatch.premiumAnnual ? ['Lower premium cost'] : []
      };
    }
  };

  const comparison = generateComparison();

  const ComparisonTable = ({ comparison }: { comparison: PolicyComparison }) => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Policy A</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Policy B</CardTitle>
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

      <div className="grid gap-4 md:grid-cols-2">
        {comparison.improvements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">Improvements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {comparison.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm">• {improvement}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {comparison.regressions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Regressions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {comparison.regressions.map((regression, index) => (
                  <li key={index} className="text-sm">• {regression}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-2">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save as Draft
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Comparison</h1>
          <p className="text-muted-foreground">
            Compare existing policies or evaluate prospective coverage
          </p>
        </div>
      </div>

      <Tabs value={compareMode} onValueChange={(value) => setCompareMode(value as 'existing' | 'prospective')}>
        <TabsList>
          <TabsTrigger value="existing">Existing vs Existing</TabsTrigger>
          <TabsTrigger value="prospective">Prospective vs Best Match</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
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

      {comparison && <ComparisonTable comparison={comparison} />}
    </div>
  );
}