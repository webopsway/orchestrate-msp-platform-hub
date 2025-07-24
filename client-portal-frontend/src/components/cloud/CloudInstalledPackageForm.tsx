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
import { Package, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  CloudInstalledPackage,
  CreateCloudInstalledPackageData,
  UpdateCloudInstalledPackageData
} from '@/types/cloudAsset';

// Schéma de validation
const packageSchema = z.object({
  asset_id: z.string().min(1, 'ID de l\'actif requis'),
  team_id: z.string().min(1, 'ID de l\'équipe requis'),
  package_name: z.string().min(1, 'Nom du package requis'),
  version: z.string().optional(),
  source: z.string().optional(),
  metadata: z.string().optional()
});

type PackageFormData = z.infer<typeof packageSchema>;

interface CloudInstalledPackageFormProps {
  package?: CloudInstalledPackage;
  onSubmit: (data: CreateCloudInstalledPackageData | UpdateCloudInstalledPackageData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CloudInstalledPackageForm = ({
  package: packageData,
  onSubmit,
  onCancel,
  loading = false
}: CloudInstalledPackageFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      asset_id: packageData?.asset_id || '',
      team_id: packageData?.team_id || '',
      package_name: packageData?.package_name || '',
      version: packageData?.version || '',
      source: packageData?.source || '',
      metadata: packageData?.metadata ? JSON.stringify(packageData.metadata, null, 2) : ''
    }
  });

  useEffect(() => {
    if (packageData) {
      reset({
        asset_id: packageData.asset_id,
        team_id: packageData.team_id,
        package_name: packageData.package_name,
        version: packageData.version || '',
        source: packageData.source || '',
        metadata: packageData.metadata ? JSON.stringify(packageData.metadata, null, 2) : ''
      });
    }
  }, [packageData, reset]);

  const handleFormSubmit = async (data: PackageFormData) => {
    try {
      const submitData = {
        ...data,
        metadata: data.metadata ? JSON.parse(data.metadata) : {}
      };

      await onSubmit(submitData);
      toast.success(packageData ? 'Package mis à jour' : 'Package ajouté');
    } catch (error) {
      console.error('Error submitting package:', error);
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
          <Package className="h-5 w-5" />
          {packageData ? 'Modifier le package' : 'Nouveau package'}
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
                disabled={!!packageData}
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
                disabled={!!packageData}
              />
              {errors.team_id && (
                <p className="text-sm text-red-500">{errors.team_id.message}</p>
              )}
            </div>
          </div>

          {/* Informations du package */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Informations du package
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package_name">Nom du package *</Label>
                <Input
                  id="package_name"
                  {...register('package_name')}
                  placeholder="nginx"
                />
                {errors.package_name && (
                  <p className="text-sm text-red-500">{errors.package_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  {...register('version')}
                  placeholder="1.18.0-6ubuntu14.3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select onValueChange={(value) => register('source').onChange({ target: { value } })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apt">APT (Debian/Ubuntu)</SelectItem>
                    <SelectItem value="yum">YUM (RHEL/CentOS)</SelectItem>
                    <SelectItem value="dnf">DNF (Fedora/RHEL 8+)</SelectItem>
                    <SelectItem value="pip">PIP (Python)</SelectItem>
                    <SelectItem value="npm">NPM (Node.js)</SelectItem>
                    <SelectItem value="docker">Docker</SelectItem>
                    <SelectItem value="manual">Installation manuelle</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Métadonnées (JSON)</Label>
            <Textarea
              id="metadata"
              {...register('metadata')}
              placeholder='{"architecture": "amd64", "priority": "optional", "section": "web"}'
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
              {loading ? 'Enregistrement...' : (packageData ? 'Mettre à jour' : 'Ajouter')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 