import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchAndFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  onAdvancedFiltersClick?: () => void;
  children?: React.ReactNode;
}

export function SearchAndFilters({
  searchValue,
  onSearchChange,
  placeholder = "Rechercher...",
  showAdvancedFilters = true,
  onAdvancedFiltersClick,
  children
}: SearchAndFiltersProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Recherche et filtres</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {showAdvancedFilters && (
            <Button 
              variant="outline"
              onClick={onAdvancedFiltersClick}
            >
              Filtres avancés
            </Button>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}