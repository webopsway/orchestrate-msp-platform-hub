import type { DashboardConfiguration, DashboardWidget } from '@/types/dashboard';

interface DashboardPreviewProps {
  configuration: DashboardConfiguration;
  widgets: DashboardWidget[];
}

export function DashboardPreview({ configuration, widgets }: DashboardPreviewProps) {
  return (
    <div className="border-2 border-dashed border-muted rounded-lg p-4">
      <div className="grid grid-cols-12 gap-2 min-h-[200px]">
        {configuration.widgets.map((widgetPos) => {
          const widget = widgets.find(w => w.name === widgetPos.id);
          if (!widget) return null;

          const gridStyle = {
            gridColumn: `span ${widgetPos.position.w}`,
            gridRow: `span ${widgetPos.position.h}`,
          };

          return (
            <div
              key={widgetPos.id}
              className="bg-muted/50 border border-muted rounded p-3 flex items-center justify-center"
              style={gridStyle}
            >
              <div className="text-center">
                <div className="font-medium text-sm">{widget.display_name}</div>
                <div className="text-xs text-muted-foreground mt-1">{widget.widget_type}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Aperçu du layout - {configuration.widgets.length} widgets configurés
      </div>
    </div>
  );
}