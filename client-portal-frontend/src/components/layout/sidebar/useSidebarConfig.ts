import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { SidebarConfig } from "./types";
import { defaultNavigationItems, defaultGroups } from "./navigationConfig";

export function useSidebarConfig() {
  const { userProfile } = useAuth();
  const { getSetting } = useAppSettings();
  
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>({
    items: defaultNavigationItems,
    groups: defaultGroups
  });

  useEffect(() => {
    const loadSidebarConfig = async () => {
      try {
        // Récupérer la configuration depuis app_settings
        const teamId = userProfile?.default_team_id || userProfile?.default_organization_id || null;
        const config = await getSetting(teamId, 'ui', 'sidebar_config');
        
        if (config) {
          setSidebarConfig(config);
        }
      } catch (error) {
        console.log('Using default sidebar configuration');
      }
    };

    if (userProfile?.is_msp_admin || userProfile?.default_team_id) {
      loadSidebarConfig();
    }
  }, [userProfile?.is_msp_admin, userProfile?.default_team_id, userProfile?.default_organization_id, getSetting]);

  return sidebarConfig;
}