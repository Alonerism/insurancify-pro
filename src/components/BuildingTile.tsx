import { useState } from "react";
import { MoreVertical, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building, Policy, Agent } from "@/types";
import { coverageTypeLabels } from "@/data/mockData";

interface BuildingTileProps {
  building: Building;
  policies: Policy[];
  agents: Agent[];
  onMove?: (buildingId: string, newAgentId: string) => void;
  onClick?: (building: Building, policies: Policy[]) => void;
  isDragging?: boolean;
}

export function BuildingTile({ 
  building, 
  policies, 
  agents, 
  onMove, 
  onClick, 
  isDragging 
}: BuildingTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get primary policy (most recent or first one)
  const primaryPolicy = policies.length > 0 ? policies[0] : null;
  
  // Get coverage types for this building
  const coverageTypes = [...new Set(policies.map(p => p.coverageType))];
  
  const handleMove = (newAgentId: string) => {
    if (onMove) {
      onMove(building.id, newAgentId);
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      } ${isHovered ? 'ring-2 ring-primary/50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(building, policies)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', building.id);
        e.currentTarget.style.opacity = '0.5';
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium truncate">
              {building.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate mt-1">
              {building.address}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Edit className="mr-2 h-3 w-3" />
                Edit Building
              </DropdownMenuItem>
              {agents.map(agent => (
                <DropdownMenuItem 
                  key={agent.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(agent.id);
                  }}
                >
                  Move to {agent.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2">
        {primaryPolicy ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {primaryPolicy.policyNumber}
              </span>
              <StatusBadge status={primaryPolicy.status} size="sm" />
            </div>
            
            <div className="flex flex-wrap gap-1">
              {coverageTypes.slice(0, 2).map(type => (
                <Badge key={type} variant="secondary" className="text-xs px-1 py-0">
                  {coverageTypeLabels[type]}
                </Badge>
              ))}
              {coverageTypes.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{coverageTypes.length - 2}
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Exp: {new Date(primaryPolicy.expirationDate).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <Button variant="ghost" size="sm" className="text-xs">
              Add Policy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}