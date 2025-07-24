import { OrganizationSelector } from '../OrganizationSelector';

interface SidebarUserContextProps {
  userProfile: {
    is_msp_admin?: boolean;
    default_team_id?: string;
    default_organization_id?: string;
  };
}

export function SidebarUserContext({ userProfile }: SidebarUserContextProps) {
  return (
    <div className="border-t mt-auto">
      <div className="p-2">
        <OrganizationSelector />
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${userProfile.is_msp_admin ? 'bg-blue-500' : 'bg-green-500'}`} />
          <span>
            {userProfile.is_msp_admin ? 'Mode MSP' : 'Mode Équipe'}
          </span>
        </div>
      </div>
    </div>
  );
}