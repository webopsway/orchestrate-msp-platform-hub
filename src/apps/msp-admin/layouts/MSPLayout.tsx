import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { MSPSidebar } from "../components/MSPSidebar";
import { MSPHeader } from "../components/MSPHeader";

export function MSPLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <MSPSidebar />
        <main className="flex-1 flex flex-col">
          <MSPHeader />
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
} 