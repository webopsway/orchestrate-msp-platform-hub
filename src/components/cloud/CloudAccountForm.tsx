import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { CloudAccountFormData, CloudProvider, Organization, Team } from '@/hooks/useCloudAccounts';

interface CloudAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CloudAccountFormData) => Promise<void>;
  providers: CloudProvider[];
  organizations: Organization[];
  teams: Team[];
  initialData?: CloudAccountFormData;
  isEditing?: boolean;
}

export const CloudAccountForm: React.FC<CloudAccountFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  providers,
  organizations,
  teams,
  initialData,
  isEditing = false
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CloudAccountFormData>({
    defaultValues: initialData || {
      name: '',
      description: '',
      provider_id: '',
      team_id: '',
      client_organization_id: '',
      account_identifier: '',
      region: '',
      environment: 'production'
    }
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onFormSubmit = async (data: CloudAccountFormData) => {
    try {
      await onSubmit(data);
      if (!isEditing) {
        reset();
      }
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const selectedOrganizationId = watch('client_organization_id');
  const filteredTeams = teams.filter(team => team.organization_id === selectedOrganizationId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le compte cloud' : 'Nouveau compte cloud'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les informations du compte cloud.'
              : 'Créez un nouveau compte cloud pour une équipe client.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du compte</Label>
              <Input
                id="name"
                {...register('name', { required: 'Le nom est requis' })}
                placeholder="Production AWS"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="account_identifier">Identifiant du compte</Label>
              <Input
                id="account_identifier"
                {...register('account_identifier', { required: 'L\'identifiant est requis' })}
                placeholder="123456789012"
              />
              {errors.account_identifier && (
                <p className="text-sm text-destructive mt-1">{errors.account_identifier.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Compte AWS de production pour le client XYZ"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider_id">Fournisseur cloud</Label>
              <Select
                value={watch('provider_id')}
                onValueChange={(value) => setValue('provider_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.provider_id && (
                <p className="text-sm text-destructive mt-1">Le fournisseur est requis</p>
              )}
            </div>

            <div>
              <Label htmlFor="environment">Environnement</Label>
              <Select
                value={watch('environment')}
                onValueChange={(value: 'production' | 'staging' | 'development') => 
                  setValue('environment', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un environnement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Développement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_organization_id">Organisation cliente</Label>
              <Select
                value={watch('client_organization_id')}
                onValueChange={(value) => {
                  setValue('client_organization_id', value);
                  setValue('team_id', ''); // Reset team when organization changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une organisation" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_organization_id && (
                <p className="text-sm text-destructive mt-1">L'organisation est requise</p>
              )}
            </div>

            <div>
              <Label htmlFor="team_id">Équipe</Label>
              <Select
                value={watch('team_id')}
                onValueChange={(value) => setValue('team_id', value)}
                disabled={!selectedOrganizationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.team_id && (
                <p className="text-sm text-destructive mt-1">L'équipe est requise</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="region">Région (optionnel)</Label>
            <Input
              id="region"
              {...register('region')}
              placeholder="us-east-1, eu-west-1, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};