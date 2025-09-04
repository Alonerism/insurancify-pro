import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchPolicies } from "@/hooks/useApi";

interface SearchResult {
  id: string;
  type: 'policy' | 'building' | 'note';
  title: string;
  snippet: string;
  score: number;
  url?: string;
}

export function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  
  const { data: searchResults = [], isLoading } = useSearchPolicies(searchTerm);

  const handleSearchClick = (result: any) => {
    // Navigate to result - implement based on result type
    console.log('Navigate to:', result);
    setShowResults(false);
    setSearchTerm("");
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex-1">
        <h1 className="text-lg font-semibold">Insurance Master</h1>
      </div>
      
      <div className="flex w-full max-w-sm items-center space-x-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search policies, buildings, agents..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(e.target.value.length > 2);
            }}
            onFocus={() => searchTerm.length > 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
              <CardContent className="p-0">
                {searchResults.map((result: any, index: number) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0 block"
                    onClick={() => handleSearchClick(result)}
                  >
                    <div className="font-medium text-sm">{result.title || result.policy_number || 'Untitled'}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.snippet || result.building?.name || 'No description'}
                    </div>
                    <div className="text-xs text-primary mt-1">
                      Score: {result.score ? Math.round(result.score * 100) : 'N/A'}%
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
          
          {showResults && isLoading && (
            <Card className="absolute top-full left-0 right-0 mt-1 z-50">
              <CardContent className="p-3 text-center text-sm text-muted-foreground">
                Searching...
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="h-4 w-4">👤</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}