import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { UserMenu } from "@/components/layout/UserMenu";
import { useTenant } from "@/contexts/TenantContext";
import { Building2 } from "lucide-react";

export function ClientHeader() {
  const { currentTenant } = useTenant();

  // Configuration du branding client
  const branding = currentTenant?.branding || {
    company_name: 'Portail Client',
    primary_color: '#059669'
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-3">
          {branding.logo ? (
            <img 
              src={branding.logo} 
              alt="Logo" 
              className="h-8 w-8 object-contain"
            />
          ) : (
            <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: branding.primary_color }}
            >
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold">
              {branding.company_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Portail client
            </p>
            {currentTenant?.domain_name && (
              <p className="text-xs text-muted-foreground">
                {currentTenant.domain_name}
              </p>
            )}
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