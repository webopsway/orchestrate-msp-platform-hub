import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Mail, Building, Calendar, Settings, Tag } from "lucide-react";
import {
  DetailDialog,
  EditDialog,
  CreateDialog,
  DeleteDialog,
  ActionButtons,
  useStandardActions,
  type DetailSection,
  type EditSection,
  type CreateSection,
  type DeleteDialogField
} from "@/components/common";

// Exemple d'utilisation des composants CRUD réutilisables
export function UsageExamples() {
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Exemple de données utilisateur
  const exampleUser = {
    id: "1",
    email: "john.doe@example.com",
    first_name: "John",
    last_name: "Doe",
    phone: "+33 6 12 34 56 78",
    department: "IT",
    role: "Développeur",
    status: "active",
    is_admin: true,
    created_at: "2024-01-15T10:00:00Z",
    website: "https://johndoe.dev",
    skills: ["React", "TypeScript", "Node.js"],
    bio: "Développeur full-stack passionné par les nouvelles technologies."
  };

  // Configuration pour DetailDialog
  const detailSections: DetailSection[] = [
    {
      title: "Informations personnelles",
      icon: User,
      fields: [
        { key: "first_name", label: "Prénom" },
        { key: "last_name", label: "Nom" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Téléphone", type: "phone" },
        { key: "website", label: "Site web", type: "url" },
        { key: "bio", label: "Biographie" }
      ]
    },
    {
      title: "Informations professionnelles",
      icon: Building,
      fields: [
        { key: "department", label: "Département" },
        { key: "role", label: "Poste" },
        { 
          key: "status", 
          label: "Statut",
          type: "badge",
          render: (value) => (
            <span className={`px-2 py-1 rounded text-xs ${
              value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {value === 'active' ? 'Actif' : 'Inactif'}
            </span>
          )
        },
        { key: "is_admin", label: "Administrateur", type: "boolean" },
        { key: "skills", label: "Compétences", type: "array" },
        { key: "created_at", label: "Date de création", type: "date" }
      ]
    }
  ];

  // Configuration pour EditDialog
  const editSections: EditSection[] = [
    {
      title: "Informations personnelles",
      icon: User,
      fields: [
        { 
          key: "first_name", 
          label: "Prénom", 
          type: "text", 
          required: true,
          placeholder: "Entrez le prénom"
        },
        { 
          key: "last_name", 
          label: "Nom", 
          type: "text", 
          required: true,
          placeholder: "Entrez le nom"
        },
        { 
          key: "email", 
          label: "Email", 
          type: "email", 
          required: true,
          placeholder: "nom@example.com"
        },
        { 
          key: "phone", 
          label: "Téléphone", 
          type: "tel",
          placeholder: "+33 6 12 34 56 78"
        },
        { 
          key: "website", 
          label: "Site web", 
          type: "url",
          placeholder: "https://example.com"
        },
        { 
          key: "bio", 
          label: "Biographie", 
          type: "textarea",
          placeholder: "Description de l'utilisateur..."
        }
      ]
    },
    {
      title: "Informations professionnelles",
      icon: Building,
      fields: [
        { 
          key: "department", 
          label: "Département", 
          type: "select",
          options: [
            { value: "IT", label: "Informatique" },
            { value: "HR", label: "Ressources Humaines" },
            { value: "SALES", label: "Commercial" },
            { value: "MARKETING", label: "Marketing" }
          ]
        },
        { 
          key: "role", 
          label: "Poste", 
          type: "text",
          placeholder: "Titre du poste"
        },
        { 
          key: "status", 
          label: "Statut", 
          type: "select",
          options: [
            { value: "active", label: "Actif" },
            { value: "inactive", label: "Inactif" }
          ]
        },
        { 
          key: "is_admin", 
          label: "Administrateur", 
          type: "boolean"
        },
        { 
          key: "skills", 
          label: "Compétences", 
          type: "tags",
          placeholder: "Appuyez sur Entrée pour ajouter"
        }
      ]
    }
  ];

  // Configuration pour CreateDialog
  const createSections: CreateSection[] = [
    {
      title: "Informations personnelles",
      icon: User,
      fields: [
        { 
          key: "first_name", 
          label: "Prénom", 
          type: "text", 
          required: true,
          placeholder: "Entrez le prénom",
          validation: { min: 2, max: 50 }
        },
        { 
          key: "last_name", 
          label: "Nom", 
          type: "text", 
          required: true,
          placeholder: "Entrez le nom",
          validation: { min: 2, max: 50 }
        },
        { 
          key: "email", 
          label: "Email", 
          type: "email", 
          required: true,
          placeholder: "nom@example.com",
          validation: { 
            pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            message: "Email invalide"
          }
        },
        { 
          key: "phone", 
          label: "Téléphone", 
          type: "tel",
          placeholder: "+33 6 12 34 56 78"
        }
      ]
    },
    {
      title: "Informations professionnelles",
      icon: Building,
      fields: [
        { 
          key: "department", 
          label: "Département", 
          type: "select",
          required: true,
          options: [
            { value: "IT", label: "Informatique" },
            { value: "HR", label: "Ressources Humaines" },
            { value: "SALES", label: "Commercial" },
            { value: "MARKETING", label: "Marketing" }
          ]
        },
        { 
          key: "role", 
          label: "Poste", 
          type: "text",
          required: true,
          placeholder: "Titre du poste"
        },
        { 
          key: "status", 
          label: "Statut", 
          type: "select",
          defaultValue: "active",
          options: [
            { value: "active", label: "Actif" },
            { value: "inactive", label: "Inactif" }
          ]
        },
        { 
          key: "is_admin", 
          label: "Administrateur", 
          type: "boolean",
          defaultValue: false
        }
      ]
    }
  ];

  // Configuration pour DeleteDialog
  const deleteFields: DeleteDialogField[] = [
    { key: "first_name", label: "Prénom" },
    { key: "last_name", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "department", label: "Département" }
  ];

  // Actions avec le hook useStandardActions
  const userActions = useStandardActions(exampleUser, {
    onView: () => setShowDetailDialog(true),
    onEdit: () => setShowEditDialog(true),
    onDelete: () => setShowDeleteDialog(true),
    onCopy: (user) => console.log("Copier:", user)
  });

  // Handlers pour les actions
  const handleSaveEdit = async (data: any) => {
    console.log("Sauvegarder les modifications:", data);
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  const handleCreate = async (data: any) => {
    console.log("Créer un nouvel utilisateur:", data);
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  const handleDelete = async () => {
    console.log("Supprimer l'utilisateur:", exampleUser);
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Exemples d'utilisation des composants CRUD</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button onClick={() => setShowDetailDialog(true)} className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Voir les détails
        </Button>
        
        <Button onClick={() => setShowEditDialog(true)} variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Modifier
        </Button>
        
        <Button onClick={() => setShowCreateDialog(true)} variant="secondary" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Créer
        </Button>
        
        <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Supprimer
        </Button>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Boutons d'actions automatiques</h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Mode inline (par défaut):</p>
            <ActionButtons actions={userActions} />
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Mode dropdown:</p>
            <ActionButtons actions={userActions} layout="dropdown" />
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Mode mixte (max 2 boutons inline):</p>
            <ActionButtons actions={userActions} maxInlineActions={2} />
          </div>
        </div>
      </div>

      {/* Dialogues */}
      <DetailDialog
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title="Détails de l'utilisateur"
        data={exampleUser}
        sections={detailSections}
      />

      <EditDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={handleSaveEdit}
        title="Modifier l'utilisateur"
        data={exampleUser}
        sections={editSections}
      />

      <CreateDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreate}
        title="Créer un nouvel utilisateur"
        sections={createSections}
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDelete={handleDelete}
        title="Supprimer l'utilisateur"
        itemName={`${exampleUser.first_name} ${exampleUser.last_name}`}
        data={exampleUser}
        displayFields={deleteFields}
        warningMessage="Attention : toutes les données associées à cet utilisateur seront également supprimées."
      />
    </div>
  );
}