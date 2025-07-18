import React, { useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Save, Settings, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardConfiguration, DashboardWidget } from '@/types/dashboard';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridLayoutProps {
  configuration?: DashboardConfiguration;
  widgets: DashboardWidget[];
  isEditing?: boolean;
  onLayoutChange?: (newLayout: Layout[], allLayouts: any) => void;
  onSave?: (configuration: DashboardConfiguration) => void;
}

interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export function DashboardGridLayout({
  configuration,
  widgets,
  isEditing = false,
  onLayoutChange,
  onSave
}: DashboardGridLayoutProps) {
  const [layouts, setLayouts] = useState(() => {
    if (!configuration?.widgets) return { lg: [] };
    
    const gridItems: GridItem[] = configuration.widgets.map((widget) => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: 2,
      minH: 2
    }));
    
    return { lg: gridItems };
  });

  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
    onLayoutChange?.(layout, allLayouts);
  }, [onLayoutChange]);

  const handleSave = useCallback(() => {
    if (!configuration || !onSave) return;
    
    const updatedWidgets = configuration.widgets.map((widget) => {
      const layoutItem = layouts.lg.find((item) => item.i === widget.id);
      if (!layoutItem) return widget;
      
      return {
        ...widget,
        position: {
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        }
      };
    });

    onSave({
      ...configuration,
      widgets: updatedWidgets
    });
  }, [configuration, layouts, onSave]);

  const renderWidget = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.name === widgetId);
    if (!widget) {
      return (
        <Card className="h-full">
          <CardContent className="p-4 h-full flex items-center justify-center">
            <div className="text-muted-foreground">Widget non trouvé</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{widget.display_name}</CardTitle>
            <Badge variant="outline" className="text-xs">{widget.widget_type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 h-[calc(100%-4rem)]">
          <div className="h-full bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-sm font-medium">{widget.display_name}</div>
              <div className="text-xs mt-1">{widget.description}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [widgets]);

  if (!configuration?.widgets.length) {
    return (
      <div className="h-64 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Aucun widget configuré</div>
          {isEditing && (
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter des widgets
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Mode édition</span>
          </div>
          <Button onClick={handleSave} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      )}
      
      <div className="dashboard-grid-container">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditing}
          isResizable={isEditing}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          preventCollision={false}
          compactType="vertical"
        >
          {configuration.widgets.map((widget) => (
            <div key={widget.id} className="grid-item">
              {renderWidget(widget.id)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}