import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, MoreHorizontal, Copy, Share, Download, Archive } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ActionButton {
  type: 'view' | 'edit' | 'delete' | 'copy' | 'share' | 'download' | 'archive' | 'custom';
  label: string;
  icon?: React.ComponentType<any>;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  disabled?: boolean;
  className?: string;
  tooltip?: string;
}

interface ActionButtonsProps {
  actions: ActionButton[];
  layout?: 'inline' | 'dropdown';
  maxInlineActions?: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function ActionButtons({
  actions,
  layout = 'inline',
  maxInlineActions = 3,
  className,
  size = 'sm'
}: ActionButtonsProps) {
  const getDefaultIcon = (type: ActionButton['type']) => {
    switch (type) {
      case 'view': return Eye;
      case 'edit': return Edit;
      case 'delete': return Trash2;
      case 'copy': return Copy;
      case 'share': return Share;
      case 'download': return Download;
      case 'archive': return Archive;
      default: return undefined;
    }
  };

  const getDefaultVariant = (type: ActionButton['type']) => {
    switch (type) {
      case 'delete': return 'destructive' as const;
      case 'view': return 'outline' as const;
      default: return 'ghost' as const;
    }
  };

  const renderButton = (action: ActionButton, isInDropdown = false) => {
    const Icon = action.icon || getDefaultIcon(action.type);
    const variant = action.variant || getDefaultVariant(action.type);

    const buttonContent = (
      <>
        {Icon && <Icon className="h-4 w-4" />}
        {isInDropdown && <span className="ml-2">{action.label}</span>}
      </>
    );

    if (isInDropdown) {
      return (
        <DropdownMenuItem
          key={action.type}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`cursor-pointer ${action.className || ''}`}
        >
          {buttonContent}
        </DropdownMenuItem>
      );
    }

    const button = (
      <Button
        key={action.type}
        variant={variant}
        size={size}
        onClick={action.onClick}
        disabled={action.disabled}
        className={action.className}
      >
        {buttonContent}
      </Button>
    );

    if (action.tooltip) {
      return (
        <TooltipProvider key={action.type}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  if (layout === 'dropdown') {
    return (
      <div className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size={size}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {actions.map((action) => renderButton(action, true))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (layout === 'inline' && actions.length <= maxInlineActions) {
    return (
      <div className={`flex items-center gap-1 ${className || ''}`}>
        {actions.map((action) => renderButton(action))}
      </div>
    );
  }

  // Mixed layout: show some buttons inline and rest in dropdown
  const inlineActions = actions.slice(0, maxInlineActions - 1);
  const dropdownActions = actions.slice(maxInlineActions - 1);

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      {inlineActions.map((action) => renderButton(action))}
      
      {dropdownActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size={size}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {dropdownActions.map((action) => renderButton(action, true))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Hook pour créer des actions standard
export function useStandardActions(item: any, handlers: {
  onView?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onCopy?: (item: any) => void;
}) {
  const actions: ActionButton[] = [];

  if (handlers.onView) {
    actions.push({
      type: 'view',
      label: 'Voir les détails',
      onClick: () => handlers.onView?.(item),
      tooltip: 'Afficher les détails'
    });
  }

  if (handlers.onEdit) {
    actions.push({
      type: 'edit',
      label: 'Modifier',
      onClick: () => handlers.onEdit?.(item),
      tooltip: 'Modifier cet élément'
    });
  }

  if (handlers.onCopy) {
    actions.push({
      type: 'copy',
      label: 'Dupliquer',
      onClick: () => handlers.onCopy?.(item),
      tooltip: 'Dupliquer cet élément'
    });
  }

  if (handlers.onDelete) {
    actions.push({
      type: 'delete',
      label: 'Supprimer',
      onClick: () => handlers.onDelete?.(item),
      tooltip: 'Supprimer cet élément',
      variant: 'destructive'
    });
  }

  return actions;
}