import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  } | React.ReactElement;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action && (
        <div>
          {React.isValidElement(action) ? (
            action
          ) : (
            <Button onClick={(action as any).onClick}>
              {(action as any).icon && React.createElement((action as any).icon, { className: "h-4 w-4 mr-2" })}
              {(action as any).label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}