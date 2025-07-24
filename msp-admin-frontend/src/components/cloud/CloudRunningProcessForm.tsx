import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Hash, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  CloudRunningProcess,
  CreateCloudRunningProcessData,
  UpdateCloudRunningProcessData
} from '@/types/cloudAsset';

// Schéma de validation
const processSchema = z.object({
  asset_id: z.string().min(1, 'ID de l\'actif requis'),
  team_id: z.string().min(1, 'ID de l\'équipe requis'),
  process_name: z.string().min(1, 'Nom du processus requis'),
  pid: z.number().optional(),
  path: z.string().optional(),
  metadata: z.string().optional()
});

type ProcessFormData = z.infer<typeof processSchema>;

interface CloudRunningProcessFormProps {
  process?: CloudRunningProcess;
  onSubmit: (data: CreateCloudRunningProcessData | UpdateCloudRunningProcessData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CloudRunningProcessForm = ({
  process: processData,
  onSubmit,
  onCancel,
  loading = false
}: CloudRunningProcessFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<ProcessFormData>({
    resolver: zodResolver(processSchema),
    defaultValues: {
      asset_id: processData?.asset_id || '',
      team_id: processData?.team_id || '',
      process_name: processData?.process_name || '',
      pid: processData?.pid || undefined,
      path: processData?.path || '',
      metadata: processData?.metadata ? JSON.stringify(processData.metadata, null, 2) : ''
    }
  });

  useEffect(() => {
    if (processData) {
      reset({
        asset_id: processData.asset_id,
        team_id: processData.team_id,
        process_name: processData.process_name,
        pid: processData.pid || undefined,
        path: processData.path || '',
        metadata: processData.metadata ? JSON.stringify(processData.metadata, null, 2) : ''
      });
    }
  }, [processData, reset]);

  const handleFormSubmit = async (data: ProcessFormData) => {
    try {
      const submitData = {
        ...data,
        metadata: data.metadata ? JSON.parse(data.metadata) : {}
      };

      await onSubmit(submitData);
      toast.success(processData ? 'Processus mis à jour' : 'Processus ajouté');
    } catch (error) {
      console.error('Error submitting process:', error);
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
          <Activity className="h-5 w-5" />
          {processData ? 'Modifier le processus' : 'Nouveau processus'}
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
                disabled={!!processData}
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
                disabled={!!processData}
              />
              {errors.team_id && (
                <p className="text-sm text-red-500">{errors.team_id.message}</p>
              )}
            </div>
          </div>

          {/* Informations du processus */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Informations du processus
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="process_name">Nom du processus *</Label>
                <Input
                  id="process_name"
                  {...register('process_name')}
                  placeholder="nginx"
                />
                {errors.process_name && (
                  <p className="text-sm text-red-500">{errors.process_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pid">PID (Process ID)</Label>
                <Input
                  id="pid"
                  type="number"
                  {...register('pid', { valueAsNumber: true })}
                  placeholder="1234"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="path">Chemin d'exécution</Label>
                <Input
                  id="path"
                  {...register('path')}
                  placeholder="/usr/sbin/nginx"
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
              placeholder='{"user": "www-data", "memory_usage": "2.5MB", "cpu_usage": "0.1%"}'
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
              {loading ? 'Enregistrement...' : (processData ? 'Mettre à jour' : 'Ajouter')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 