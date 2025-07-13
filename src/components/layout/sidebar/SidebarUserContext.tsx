interface SidebarUserContextProps {
  userProfile: {
    is_msp_admin?: boolean;
    default_team_id?: string;
    default_organization_id?: string;
  };
}

export function SidebarUserContext({ userProfile }: SidebarUserContextProps) {
  return (
    <div className="p-4 border-t mt-auto">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${userProfile.is_msp_admin ? 'bg-blue-500' : 'bg-green-500'}`} />
          <span>
            {userProfile.is_msp_admin ? 'Mode MSP' : 'Mode Équipe'}
          </span>
        </div>
        {(userProfile.default_team_id || userProfile.default_organization_id) && (
          <div className="text-xs text-muted-foreground truncate">
            {userProfile.default_team_id 
              ? `Équipe: ${userProfile.default_team_id.slice(0, 8)}...` 
              : `Org: ${userProfile.default_organization_id?.slice(0, 8)}...`
            }
          </div>
        )}
      </div>
    </div>
  );
}