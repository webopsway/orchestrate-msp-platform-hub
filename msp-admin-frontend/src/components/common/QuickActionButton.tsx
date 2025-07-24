import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  onClick: () => void;
}

export function QuickActionButton({ 
  title, 
  description, 
  icon: Icon, 
  iconColor = "text-primary",
  onClick 
}: QuickActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-start gap-3 p-3 text-left border rounded-lg hover:bg-accent transition-colors w-full hover-scale"
    >
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}