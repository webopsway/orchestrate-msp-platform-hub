import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { Toaster } from "@/components/ui/sonner";
import { MSPAdminRoutes } from "./routes/MSPAdminRoutes";
import { MSPGuard } from "./components/MSPGuard";

const queryClient = new QueryClient();

export const MSPAdminApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <OrganizationProvider>
              <MSPGuard>
                <MSPAdminRoutes />
              </MSPGuard>
            </OrganizationProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
); 