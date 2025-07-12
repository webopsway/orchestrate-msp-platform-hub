import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { UserPlus, User, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface ChangeAssignmentProps {
  changeId: string;
  currentAssignee?: string;
  onAssigned?: (assigneeId: string | null) => void;
  disabled?: boolean;
}

export function ChangeAssignment({ 
  changeId, 
  currentAssignee, 
  onAssigned, 
  disabled = false 
}: ChangeAssignmentProps) {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const organizationId = userProfile?.default_organization_id;
      const teamId = userProfile?.default_team_id;

      if (userProfile?.is_msp_admin) {
        // MSP admin sees all users if organization context is available
        if (organizationId) {
          const { data: orgMembers, error: orgError } = await supabase
            .from('organization_memberships')
            .select(`
              user_id,
              profiles:user_id (
                id,
                email,
                first_name,
                last_name
              )
            `)
            .eq('organization_id', organizationId);

          if (orgError) throw orgError;
          const orgUsers = orgMembers?.map(member => member.profiles).filter(Boolean) || [];
          setUsers(orgUsers as User[]);
        } else {
          // If no organization context, show all users (for MSP admin)
          const { data: allUsers, error: usersError } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name');
            
          if (usersError) throw usersError;
          setUsers(allUsers as User[]);
        }
      } else if (teamId) {
        // Regular users see team members
        const { data: teamMembers, error: teamError } = await supabase
          .from('team_memberships')
          .select(`
            user_id,
            profiles:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('team_id', teamId);

        if (teamError) throw teamError;
        const teamUsers = teamMembers?.map(member => member.profiles).filter(Boolean) || [];
        setUsers(teamUsers as User[]);
      } else if (organizationId) {
        // Fallback to organization level
        const { data: orgMembers, error: orgError } = await supabase
          .from('organization_memberships')
          .select(`
            user_id,
            profiles:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('organization_id', organizationId);

        if (orgError) throw orgError;
        const orgUsers = orgMembers?.map(member => member.profiles).filter(Boolean) || [];
        setUsers(orgUsers as User[]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const assignChange = async (assigneeId: string | null) => {
    try {
      setAssigning(true);
      
      const { error } = await supabase
        .from('itsm_change_requests')
        .update({ approved_by: assigneeId })
        .eq('id', changeId);

      if (error) throw error;

      toast.success('Changement assigné avec succès');
      onAssigned?.(assigneeId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error assigning change:', error);
      toast.error('Erreur lors de l\'assignation du changement');
    } finally {
      setAssigning(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  const currentUser = users.find(u => u.id === currentAssignee);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={currentAssignee ? "secondary" : "outline"} 
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          {currentAssignee ? (
            <>
              <User className="h-4 w-4" />
              <span className="max-w-24 truncate">
                {currentUser ? getUserDisplayName(currentUser) : currentAssignee}
              </span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Assigner
            </>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-0" side="bottom" align="start">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Assigner le changement</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Sélectionnez un membre de l'équipe
          </p>
        </div>
        
        <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {currentAssignee && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => assignChange(null)}
                  disabled={assigning}
                >
                  <X className="h-4 w-4" />
                  Supprimer l'assignation
                </Button>
              )}
              
              {users.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => assignChange(user.id)}
                  disabled={assigning}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <User className="h-4 w-4" />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    {user.id === currentAssignee && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </Button>
              ))}
              
              {users.length === 0 && !loading && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Aucun membre d'équipe disponible
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}