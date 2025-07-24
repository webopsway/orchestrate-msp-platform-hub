import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationCenter() {
  const notifications = [
    {
      id: 1,
      title: "Nouvelle alerte système",
      message: "Le serveur prod-web-01 a dépassé 90% d'utilisation CPU",
      time: "Il y a 5 min",
      read: false,
    },
    {
      id: 2,
      title: "Ticket résolu",
      message: "Le ticket #12345 a été marqué comme résolu",
      time: "Il y a 1h",
      read: true,
    },
    {
      id: 3,
      title: "Sauvegarde terminée",
      message: "La sauvegarde quotidienne s'est terminée avec succès",
      time: "Il y a 2h",
      read: true,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {unreadCount} nouvelle{unreadCount !== 1 ? 's' : ''} notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                !notification.read ? 'bg-muted/30' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  !notification.read ? 'bg-primary' : 'bg-muted'
                }`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full">
            Voir toutes les notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}