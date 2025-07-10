import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  trendColor?: "green" | "red" | "blue" | "yellow";
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendColor = "green",
  onClick
}: StatsCardProps) {
  const getTrendColor = () => {
    switch (trendColor) {
      case "green": return "text-emerald-600 bg-emerald-50";
      case "red": return "text-red-600 bg-red-50";
      case "blue": return "text-blue-600 bg-blue-50";
      case "yellow": return "text-yellow-600 bg-yellow-50";
      default: return "text-emerald-600 bg-emerald-50";
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <Badge variant="outline" className={`mt-2 text-xs ${getTrendColor()}`}>
                {trend}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}