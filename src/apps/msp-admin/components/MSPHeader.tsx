import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { UserMenu } from "@/components/layout/UserMenu";
import { Shield } from "lucide-react";

export function MSPHeader() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              Administration MSP
            </h1>
            <p className="text-sm text-muted-foreground">
              Interface d'administration et supervision
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
} 