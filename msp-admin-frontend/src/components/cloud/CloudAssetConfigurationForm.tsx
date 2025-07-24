import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Cpu, HardDrive, Network, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  CloudAssetConfiguration,
  CreateCloudAssetConfigurationData,
  UpdateCloudAssetConfigurationData
} from '@/types/cloudAsset';

// Schéma de validation
const configurationSchema = z.object({
  asset_id: z.string().min(1, 'ID de l\'actif requis'),
  team_id: z.string().min(1, 'ID de l\'équipe requis'),
  os: z.string().optional(),
  cpu: z.string().optional(),
  ram: z.string().optional(),
  ip: z.string().optional(),
  metadata: z.string().optional()
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

interface CloudAssetConfigurationFormProps {
  configuration?: CloudAssetConfiguration;
  onSubmit: (data: CreateCloudAssetConfigurationData | UpdateCloudAssetConfigurationData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CloudAssetConfigurationForm = ({
  configuration,
  onSubmit,
  onCancel,
  loading = false
}: CloudAssetConfigurationFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      asset_id: configuration?.asset_id || '',
      team_id: configuration?.team_id || '',
      os: configuration?.os || '',
      cpu: configuration?.cpu || '',
      ram: configuration?.ram || '',
      ip: configuration?.ip || '',
      metadata: configuration?.metadata ? JSON.stringify(configuration.metadata, null, 2) : ''
    }
  });

  useEffect(() => {
    if (configuration) {
      reset({
        asset_id: configuration.asset_id,
        team_id: configuration.team_id,
        os: configuration.os || '',
        cpu: configuration.cpu || '',
        ram: configuration.ram || '',
        ip: configuration.ip || '',
        metadata: configuration.metadata ? JSON.stringify(configuration.metadata, null, 2) : ''
      });
    }
  }, [configuration, reset]);

  const handleFormSubmit = async (data: ConfigurationFormData) => {
    try {
      const submitData = {
        ...data,
        metadata: data.metadata ? JSON.parse(data.metadata) : {}
      };

      await onSubmit(submitData);
      toast.success(configuration ? 'Configuration mise à jour' : 'Configuration créée');
    } catch (error) {
      console.error('Error submitting configuration:', error);
      toast.error('Erreur lors de la soumission');
    }
  };

  const handleMetadataValidation = (value: string) => {
    try {
      if (value) {
        JSON.parse(value);
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {configuration ? 'Modifier la configuration' : 'Nouvelle configuration'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_id">ID de l'actif *</Label>
              <Input
                id="asset_id"
                {...register('asset_id')}
                placeholder="UUID de l'actif cloud"
                disabled={!!configuration}
              />
              {errors.asset_id && (
                <p className="text-sm text-red-500">{errors.asset_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_id">ID de l'équipe *</Label>
              <Input
                id="team_id"
                {...register('team_id')}
                placeholder="UUID de l'équipe"
                disabled={!!configuration}
              />
              {errors.team_id && (
                <p className="text-sm text-red-500">{errors.team_id.message}</p>
              )}
            </div>
          </div>

          {/* Configuration système */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Server className="h-4 w-4" />
              Configuration système
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="os">Système d'exploitation</Label>
                <Input
                  id="os"
                  {...register('os')}
                  placeholder="Ubuntu 22.04 LTS"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpu">Processeur</Label>
                <Input
                  id="cpu"
                  {...register('cpu')}
                  placeholder="Intel Xeon E5-2686 v4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ram">Mémoire RAM</Label>
                <Input
                  id="ram"
                  {...register('ram')}
                  placeholder="16 GB"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ip">Adresse IP</Label>
                <Input
                  id="ip"
                  {...register('ip')}
                  placeholder="192.168.1.100"
                />
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Métadonnées (JSON)</Label>
            <Textarea
              id="metadata"
              {...register('metadata')}
              placeholder='{"environment": "production", "zone": "us-east-1"}'
              rows={4}
              className="font-mono text-sm"
            />
            {watch('metadata') && !handleMetadataValidation(watch('metadata')) && (
              <p className="text-sm text-red-500">JSON invalide</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || (watch('metadata') && !handleMetadataValidation(watch('metadata')))}
            >
              {loading ? 'Enregistrement...' : (configuration ? 'Mettre à jour' : 'Créer')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 