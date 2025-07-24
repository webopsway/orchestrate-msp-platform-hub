import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationCenter } from "./NotificationCenter";
import { UserMenu } from "./UserMenu";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useTenantUI } from "@/contexts/TenantContext";
import { usePortal } from "@/contexts/PortalContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const tenantUI = useTenantUI();
  const { portalConfig, isMSPAdminPortal } = usePortal();

  // Utiliser la configuration du portail si disponible, sinon fallback sur tenantUI
  const displayConfig = portalConfig?.branding || {
    company_name: tenantUI?.companyName || 'Plateforme MSP',
    logo: tenantUI?.logo,
    primary_color: '#3b82f6'
  };

  const headerSubtitle = isMSPAdminPortal() 
    ? 'Administration et supervision' 
    : 'Portail client';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                {displayConfig.logo && (
                  <img 
                    src={displayConfig.logo} 
                    alt="Logo" 
                    className="h-8 w-8 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-xl font-semibold">
                    {displayConfig.company_name}
                  </h1>
                  <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
                  {!isMSPAdminPortal() && portalConfig?.tenant_domain && (
                    <p className="text-xs text-muted-foreground">
                      {portalConfig.tenant_domain}
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
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
}