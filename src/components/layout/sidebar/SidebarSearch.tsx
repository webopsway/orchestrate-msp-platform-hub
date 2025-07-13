import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SidebarSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SidebarSearch({ searchTerm, onSearchChange }: SidebarSearchProps) {
  return (
    <div className="p-4 border-b">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
    </div>
  );
}