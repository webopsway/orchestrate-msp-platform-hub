import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { Toaster } from "@/components/ui/sonner";
import { ClientPortalRoutes } from "./routes/ClientPortalRoutes";
import { ClientGuard } from "./components/ClientGuard";

const queryClient = new QueryClient();

export const ClientPortalApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <OrganizationProvider>
              <ClientGuard>
                <ClientPortalRoutes />
              </ClientGuard>
            </OrganizationProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
); 