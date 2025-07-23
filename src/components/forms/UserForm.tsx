import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useOrganizationsAndTeams } from "@/hooks/useOrganizationsAndTeams";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const userSchema = z.object({
  email: z.string().email("Email invalide"),
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
  role: z.string().min(1, "Le rôle est requis"),
  organization_id: z.string().min(1, "L'organisation est requise"),
  team_id: z.string().min(1, "L'équipe est requise"),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["active", "inactive", "pending", "suspended"]).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  defaultValues?: Partial<UserFormData>;
  loading?: boolean;
  title?: string;
  roles?: Array<{ id: string; name: string; display_name: string }>;
  isEdit?: boolean;
}

export const UserForm = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
  loading = false,
  title = "Nouvel utilisateur",
  roles = [],
  isEdit = false
}: UserFormProps) => {
  const { data: orgData, isLoading: orgLoading } = useOrganizationsAndTeams();
  const [filteredTeams, setFilteredTeams] = useState<any[]>([]);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "",
      organization_id: "",
      team_id: "",
      department: "",
      position: "",
      status: "active",
    },
  });

  const selectedOrganizationId = form.watch("organization_id");

  // Filtrer les équipes selon l'organisation sélectionnée
  useEffect(() => {
    if (selectedOrganizationId && orgData?.teams) {
      const teamsForOrg = orgData.teams.filter(
        team => team.organization_id === selectedOrganizationId
      );
      setFilteredTeams(teamsForOrg);

      // Reset team selection si l'organisation change
      const currentTeamId = form.getValues("team_id");
      const isTeamStillValid = teamsForOrg.some(team => team.id === currentTeamId);
      if (!isTeamStillValid) {
        form.setValue("team_id", "");
      }
    } else {
      setFilteredTeams([]);
    }
  }, [selectedOrganizationId, orgData?.teams, form]);

  // Reset form when defaultValues change or dialog opens
  useEffect(() => {
    if (open) {
      const formData = {
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "",
        organization_id: "",
        team_id: "",
        department: "",
        position: "",
        status: "active" as const,
        ...defaultValues,
      };
      form.reset(formData);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const getOrganizationName = (orgId: string) => {
    const org = orgData?.organizations.find(o => o.id === orgId);
    return org ? org.name : orgId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations de l'utilisateur"
              : "Créez un nouvel utilisateur et associez-le à une organisation et une équipe"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Informations personnelles */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jean"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dupont"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="jean.dupont@example.com"
                      type="email"
                      disabled={loading || isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+33 1 23 45 67 89"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organisation et équipe - Section importante */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Association organisationnelle (obligatoire)
              </h3>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Organisation *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading || orgLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une organisation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orgData?.organizations.map(org => (
                            <SelectItem key={org.id} value={org.id}>
                              <div className="flex items-center gap-2">
                                <span>{org.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="team_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Équipe *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading || !selectedOrganizationId || filteredTeams.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              !selectedOrganizationId
                                ? "Sélectionnez d'abord une organisation"
                                : filteredTeams.length === 0
                                ? "Aucune équipe disponible"
                                : "Sélectionnez une équipe"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredTeams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                              {team.description && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  - {team.description}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {selectedOrganizationId && filteredTeams.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Aucune équipe trouvée pour l'organisation "{getOrganizationName(selectedOrganizationId)}".
                          Créez d'abord une équipe dans cette organisation.
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Rôle et informations professionnelles */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Informations professionnelles
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="suspended">Suspendu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Département</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="IT, Finance, RH..."
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poste</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Développeur, Manager..."
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || orgLoading}
                className="min-w-[120px]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Modifier" : "Créer l'utilisateur"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
