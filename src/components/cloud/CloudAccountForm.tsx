import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CloudAccountFormData, CloudProvider, Organization, Team } from '@/hooks/useCloudAccounts';

interface CloudAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CloudAccountFormData) => Promise<void>;
  providers: CloudProvider[];
  organizations: Organization[];
  teams: Team[];
  initialData?: Partial<CloudAccountFormData>;
  isEditing?: boolean;
}

export const CloudAccountForm = ({
  open,
  onOpenChange,
  onSubmit,
  providers,
  organizations,
  teams,
  initialData,
  isEditing = false
}: CloudAccountFormProps) => {
  const [formData, setFormData] = useState<CloudAccountFormData>({
    name: '',
    description: '',
    provider_id: '',
    team_id: '',
    client_organization_id: '',
    account_identifier: '',
    region: '',
    environment: 'production'
  });
  const [loading, setLoading] = useState(false);

  // Initialiser le formulaire
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        provider_id: initialData.provider_id || '',
        team_id: initialData.team_id || '',
        client_organization_id: initialData.client_organization_id || '',
        account_identifier: initialData.account_identifier || '',
        region: initialData.region || '',
        environment: initialData.environment || 'production'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        provider_id: '',
        team_id: '',
        client_organization_id: '',
        account_identifier: '',
        region: '',
        environment: 'production'
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      // L'erreur est gérée dans le hook
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team => 
    team.organization_id === formData.client_organization_id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le compte cloud' : 'Nouveau compte cloud'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du compte *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nom descriptif du compte"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description optionnelle"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="provider">Fournisseur cloud *</Label>
            <Select
              value={formData.provider_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, provider_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="client_organization">Organisation cliente *</Label>
            <Select
              value={formData.client_organization_id}
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  client_organization_id: value,
                  team_id: '' // Reset team when organization changes
                }));
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une organisation" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.client_organization_id && (
            <div>
              <Label htmlFor="team">Équipe *</Label>
              <Select
                value={formData.team_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, team_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="account_identifier">Identifiant du compte *</Label>
            <Input
              id="account_identifier"
              value={formData.account_identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, account_identifier: e.target.value }))}
              placeholder="AWS Account ID, Azure Subscription ID, etc."
              required
            />
          </div>

          <div>
            <Label htmlFor="region">Région</Label>
            <Input
              id="region"
              value={formData.region}
              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              placeholder="us-east-1, westeurope, etc."
            />
          </div>

          <div>
            <Label htmlFor="environment">Environnement</Label>
            <Select
              value={formData.environment}
              onValueChange={(value: 'production' | 'staging' | 'development') => 
                setFormData(prev => ({ ...prev, environment: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="development">Développement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};