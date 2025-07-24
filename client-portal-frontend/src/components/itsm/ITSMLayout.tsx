import { ReactNode } from "react";
import { 
  PageHeader, 
  DataGrid
} from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, LucideIcon } from "lucide-react";

interface StatCard {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

interface TableColumn {
  key: string;
  label: string;
  render?: (item: any) => ReactNode;
}

interface ITSMLayoutProps {
  title: string;
  description: string;
  actionLabel: string;
  actionIcon: LucideIcon;
  onActionClick: () => void;
  stats: StatCard[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: ReactNode;
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
}

export function ITSMLayout({
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onActionClick,
  stats,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  filters,
  columns,
  data,
  loading = false
}: ITSMLayoutProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={title}
          description={description}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={{
          label: actionLabel,
          icon: ActionIcon,
          onClick: onActionClick
        }}
      />

      {/* Statistiques */}
      <DataGrid columns={3}>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </DataGrid>

      {/* Filtres et table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {filters && (
              <div className="flex gap-2">
                {filters}
              </div>
            )}
          </div>

          {/* Tableau */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key} className={column.key === 'actions' ? 'text-right' : ''}>
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={item.id || index}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.key === 'actions' ? 'text-right' : ''}>
                        {column.render ? column.render(item) : item[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}