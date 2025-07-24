import { useState } from 'react';
import { toast } from 'sonner';

export interface UseITSMCrudOptions<T> {
  onRefresh?: () => void;
}

export function useITSMCrud<T>(options?: UseITSMCrudOptions<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openCreate = () => {
    setSelectedItem(null);
    setIsCreateOpen(true);
  };

  const openEdit = (item: T) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const openDelete = (item: T) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const openDetail = (item: T) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setIsDetailOpen(false);
    setSelectedItem(null);
  };

  const handleCreate = async (
    createFn: (data: any) => Promise<boolean>,
    data: any
  ): Promise<boolean> => {
    try {
      const success = await createFn(data);
      if (success) {
        toast.success('Élément créé avec succès');
        options?.onRefresh?.();
        closeAll();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating:', error);
      toast.error('Erreur lors de la création');
      return false;
    }
  };

  const handleUpdate = async (
    updateFn: (data: any) => Promise<boolean>,
    data: any
  ): Promise<boolean> => {
    try {
      const success = await updateFn(data);
      if (success) {
        toast.success('Élément modifié avec succès');
        options?.onRefresh?.();
        closeAll();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Erreur lors de la modification');
      return false;
    }
  };

  const handleDelete = async (
    deleteFn: () => Promise<boolean>
  ): Promise<boolean> => {
    try {
      const success = await deleteFn();
      if (success) {
        toast.success('Élément supprimé avec succès');
        options?.onRefresh?.();
        closeAll();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  };

  return {
    selectedItem,
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    isDetailOpen,
    openCreate,
    openEdit,
    openDelete,
    openDetail,
    closeAll,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}