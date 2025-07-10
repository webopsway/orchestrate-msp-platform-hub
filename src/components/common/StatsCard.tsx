import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: string;
  trendColor?: "green" | "red" | "blue" | "orange";
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  trendColor = "green" 
}: StatsCardProps) {
  const getTrendColorClass = (color: string) => {
    switch (color) {
      case "green": return "text-green-600";
      case "red": return "text-red-600";
      case "blue": return "text-blue-600";
      case "orange": return "text-orange-600";
      default: return "text-green-600";
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className={`text-xs mt-1 ${getTrendColorClass(trendColor)}`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}