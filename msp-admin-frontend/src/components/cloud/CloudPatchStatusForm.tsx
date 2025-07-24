import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  CloudPatchStatus,
  CreateCloudPatchStatusData,
  UpdateCloudPatchStatusData,
  PatchStatus
} from '@/types/cloudAsset';

// Schéma de validation
const patchSchema = z.object({
  asset_id: z.string().min(1, 'ID de l\'actif requis'),
  team_id: z.string().min(1, 'ID de l\'équipe requis'),
  patch_name: z.string().optional(),
  cve_id: z.string().optional(),
  status: z.enum(['applied', 'pending', 'not_available', 'unknown']),
  metadata: z.string().optional()
});

type PatchFormData = z.infer<typeof patchSchema>;

interface CloudPatchStatusFormProps {
  patch?: CloudPatchStatus;
  onSubmit: (data: CreateCloudPatchStatusData | UpdateCloudPatchStatusData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CloudPatchStatusForm = ({
  patch: patchData,
  onSubmit,
  onCancel,
  loading = false
}: CloudPatchStatusFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm<PatchFormData>({
    resolver: zodResolver(patchSchema),
    defaultValues: {
      asset_id: patchData?.asset_id || '',
      team_id: patchData?.team_id || '',
      patch_name: patchData?.patch_name || '',
      cve_id: patchData?.cve_id || '',
      status: patchData?.status || 'unknown',
      metadata: patchData?.metadata ? JSON.stringify(patchData.metadata, null, 2) : ''
    }
  });

  useEffect(() => {
    if (patchData) {
      reset({
        asset_id: patchData.asset_id,
        team_id: patchData.team_id,
        patch_name: patchData.patch_name || '',
        cve_id: patchData.cve_id || '',
        status: patchData.status,
        metadata: patchData.metadata ? JSON.stringify(patchData.metadata, null, 2) : ''
      });
    }
  }, [patchData, reset]);

  const handleFormSubmit = async (data: PatchFormData) => {
    try {
      const submitData = {
        ...data,
        metadata: data.metadata ? JSON.parse(data.metadata) : {}
      };

      await onSubmit(submitData);
      toast.success(patchData ? 'Patch mis à jour' : 'Patch ajouté');
    } catch (error) {
      console.error('Error submitting patch:', error);
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

  const getStatusIcon = (status: PatchStatus) => {
    switch (status) {
      case 'applied': return CheckCircle;
      case 'pending': return Clock;
      case 'not_available': return XCircle;
      case 'unknown': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const getStatusColor = (status: PatchStatus) => {
    switch (status) {
      case 'applied': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'not_available': return 'text-red-600';
      case 'unknown': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {patchData ? 'Modifier le patch' : 'Nouveau patch'}
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
                disabled={!!patchData}
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
                disabled={!!patchData}
              />
              {errors.team_id && (
                <p className="text-sm text-red-500">{errors.team_id.message}</p>
              )}
            </div>
          </div>

          {/* Informations du patch */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Informations du patch
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patch_name">Nom du patch</Label>
                <Input
                  id="patch_name"
                  {...register('patch_name')}
                  placeholder="CVE-2023-1234-patch"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cve_id">CVE ID</Label>
                <Input
                  id="cve_id"
                  {...register('cve_id')}
                  placeholder="CVE-2023-1234"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">Statut *</Label>
                <Select 
                  value={watch('status')} 
                  onValueChange={(value: PatchStatus) => setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Appliqué
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        En attente
                      </div>
                    </SelectItem>
                    <SelectItem value="not_available">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Non disponible
                      </div>
                    </SelectItem>
                    <SelectItem value="unknown">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-gray-600" />
                        Inconnu
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Aperçu du statut */}
            {watch('status') && (
              <div className={`p-3 rounded-lg border flex items-center gap-2 ${getStatusColor(watch('status') as PatchStatus)}`}>
                {React.createElement(getStatusIcon(watch('status') as PatchStatus), { className: 'h-4 w-4' })}
                <span className="font-medium">
                  {watch('status') === 'applied' && 'Patch appliqué avec succès'}
                  {watch('status') === 'pending' && 'Patch en attente d\'application'}
                  {watch('status') === 'not_available' && 'Patch non disponible'}
                  {watch('status') === 'unknown' && 'Statut du patch inconnu'}
                </span>
              </div>
            )}
          </div>

          {/* Métadonnées */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Métadonnées (JSON)</Label>
            <Textarea
              id="metadata"
              {...register('metadata')}
              placeholder='{"applied_at": "2023-12-01T10:00:00Z", "applied_by": "automated", "rollback_available": true}'
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
              {loading ? 'Enregistrement...' : (patchData ? 'Mettre à jour' : 'Ajouter')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 