import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CRUDTable } from "@/components/common/CRUDTable";
// import { CRUDForm } from "@/components/common/CRUDForm";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface Organization {
  id: string;
  msp_id: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  subscription_plan?: string;
  subscription_status?: 'active' | 'expired' | 'cancelled';
  user_count: number;
  team_count: number;
  created_at: string;
  updated_at: string;
  metadata?: {
    industry?: string;
    size?: string;
    contact_person?: string;
    [key: string]: any;
  };
}

interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  user_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

const Organizations = () => {
  const { sessionContext } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<any[]>([]);

  // États pour les modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);

  // États pour les formulaires
  const [newOrganization, setNewOrganization] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    industry: "",
    size: "",
    contact_person: ""
  });

  const [editOrganization, setEditOrganization] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    status: "active" as const,
    subscription_plan: "",
    industry: "",
    size: "",
    contact_person: ""
  });

  useEffect(() => {
    if (sessionContext?.current_team_id) {
      fetchData();
    }
  }, [sessionContext?.current_team_id, currentPage, pageSize, searchTerm]);

  const fetchData = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      
      // Récupérer les organisations avec pagination
      let query = supabase
        .from('organizations')
        .select('*', { count: 'exact' });

      // Appliquer les filtres
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%`);
      }

      // Skip complex filters to avoid type issues
      // filters.forEach(filter => {
      //   if (filter.value) {
      //     query = query.eq(filter.key, filter.value);
      //   }
      // });

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: orgsData, error: orgsError, count } = await query;

      if (orgsError) throw orgsError;
      
      // Transform data to match interface
      const transformedOrgs = (orgsData || []).map(org => ({
        ...org,
        msp_id: org.parent_organization_id || sessionContext.current_team_id,
        status: 'active' as const,
        user_count: 0,
        team_count: 0,
        description: (org.metadata as any)?.description || '',
        website: (org.metadata as any)?.website || '',
        email: (org.metadata as any)?.email || '',
        phone: (org.metadata as any)?.phone || '',
        address: (org.metadata as any)?.address || {},
        subscription_plan: (org.metadata as any)?.subscription_plan || 'basic',
        subscription_status: (org.metadata as any)?.subscription_status || 'active',
        metadata: (org.metadata as any) || {}
      }));
      
      setOrganizations(transformedOrgs);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Erreur lors du chargement des organisations');
    }
  };

  const fetchTeams = async (organizationId: string) => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationId);

      if (teamsError) throw teamsError;
      
      // Transform data to match interface
      const transformedTeams = (teamsData || []).map(team => ({
        ...team,
        user_count: 0,
        status: 'active' as const
      }));
      
      setTeams(transformedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Erreur lors du chargement des équipes');
    }
  };

  const createOrganization = async (data: any) => {
    if (!sessionContext?.current_team_id) return;

    try {
      
      const orgData = {
        name: data.name,
        type: 'client' as const,
        metadata: {
          description: data.description,
          website: data.website,
          email: data.email,
          phone: data.phone,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country
          },
          subscription_plan: data.subscription_plan || 'basic',
          subscription_status: 'active',
          industry: data.industry,
          size: data.size,
          contact_person: data.contact_person
        }
      };
      
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert([orgData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Organisation créée avec succès');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const updateOrganization = async (data: any) => {
    if (!selectedOrganization) return;

    try {
      
      const updateData = {
        name: data.name,
        updated_at: new Date().toISOString(),
        metadata: {
          description: data.description,
          website: data.website,
          email: data.email,
          phone: data.phone,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country
          },
          subscription_plan: data.subscription_plan,
          industry: data.industry,
          size: data.size,
          contact_person: data.contact_person
        }
      };

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', selectedOrganization.id);

      if (error) throw error;

      toast.success('Organisation mise à jour avec succès');
      setIsEditModalOpen(false);
      setSelectedOrganization(null);
      fetchData();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteOrganization = async (org: Organization) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id);

      if (error) throw error;

      toast.success('Organisation supprimée');
      setIsDeleteModalOpen(false);
      setSelectedOrganization(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetNewOrgForm = () => {
    setNewOrganization({
      name: "",
      description: "",
      website: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      industry: "",
      size: "",
      contact_person: ""
    });
  };

  const resetEditOrgForm = () => {
    setEditOrganization({
      name: "",
      description: "",
      website: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      status: "active",
      subscription_plan: "",
      industry: "",
      size: "",
      contact_person: ""
    });
    setSelectedOrganization(null);
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrganization(org);
    setEditOrganization({
      name: org.name,
      description: org.description || "",
      website: org.website || "",
      email: org.email || "",
      phone: org.phone || "",
      street: org.address?.street || "",
      city: org.address?.city || "",
      state: org.address?.state || "",
      postal_code: org.address?.postal_code || "",
      country: org.address?.country || "",
      status: "active" as const,
      subscription_plan: org.subscription_plan || "",
      industry: org.metadata?.industry || "",
      size: org.metadata?.size || "",
      contact_person: org.metadata?.contact_person || ""
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (org: Organization) => {
    setSelectedOrganization(org);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (org: Organization) => {
    setSelectedOrganization(org);
    setIsDeleteModalOpen(true);
  };

  const openTeamsModal = async (org: Organization) => {
    setSelectedOrganization(org);
    await fetchTeams(org.id);
    setIsTeamsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "pending": return "outline";
      case "suspended": return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "inactive": return <XCircle className="h-4 w-4" />;
      case "pending": return <AlertCircle className="h-4 w-4" />;
      case "suspended": return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Organisation',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: Organization) => (
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-medium">{row.name}</p>
            <div className="flex space-x-1">
              {row.status === 'active' && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              )}
              {row.subscription_status === 'expired' && (
                <Badge variant="destructive" className="text-xs">
                  Expiré
                </Badge>
              )}
            </div>
          </div>
          {row.description && (
            <p className="text-sm text-muted-foreground">{row.description}</p>
          )}
          {row.website && (
            <a 
              href={row.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              <Globe className="h-3 w-3 mr-1" />
              {row.website}
            </a>
          )}
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      type: 'custom' as const,
      sortable: false,
      render: (value: any, row: Organization) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{row.phone}</span>
            </div>
          )}
          {row.address?.city && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{row.address.city}, {row.address.country}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'stats',
      label: 'Statistiques',
      type: 'custom' as const,
      sortable: false,
      render: (value: any, row: Organization) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{row.user_count || 0} utilisateurs</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{row.team_count || 0} équipes</span>
          </div>
          {row.metadata?.industry && (
            <Badge variant="outline" className="text-xs">
              {row.metadata.industry}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'subscription',
      label: 'Abonnement',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: Organization) => (
        <div className="space-y-1">
          <Badge variant="outline">
            {row.subscription_plan || 'Basic'}
          </Badge>
          {row.subscription_status && (
            <Badge variant={row.subscription_status === 'active' ? 'default' : 'destructive'}>
              {row.subscription_status}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Créé le',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: Organization) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  const organizationFields = [
    {
      key: 'name',
      label: 'Nom de l\'organisation',
      type: 'text' as const,
      required: true,
      placeholder: 'Nom de l\'organisation'
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Description de l\'organisation...'
    },
    {
      key: 'website',
      label: 'Site web',
      type: 'text' as const,
      placeholder: 'https://www.example.com'
    },
    {
      key: 'email',
      label: 'Email de contact',
      type: 'email' as const,
      placeholder: 'contact@example.com'
    },
    {
      key: 'phone',
      label: 'Téléphone',
      type: 'text' as const,
      placeholder: '+33 1 23 45 67 89'
    },
    {
      key: 'street',
      label: 'Adresse',
      type: 'text' as const,
      placeholder: '123 Rue de la Paix'
    },
    {
      key: 'city',
      label: 'Ville',
      type: 'text' as const,
      placeholder: 'Paris'
    },
    {
      key: 'state',
      label: 'État/Région',
      type: 'text' as const,
      placeholder: 'Île-de-France'
    },
    {
      key: 'postal_code',
      label: 'Code postal',
      type: 'text' as const,
      placeholder: '75001'
    },
    {
      key: 'country',
      label: 'Pays',
      type: 'text' as const,
      placeholder: 'France'
    },
    {
      key: 'industry',
      label: 'Secteur d\'activité',
      type: 'select' as const,
      options: [
        { value: 'technology', label: 'Technologie' },
        { value: 'healthcare', label: 'Santé' },
        { value: 'finance', label: 'Finance' },
        { value: 'education', label: 'Éducation' },
        { value: 'retail', label: 'Commerce' },
        { value: 'manufacturing', label: 'Industrie' },
        { value: 'other', label: 'Autre' }
      ]
    },
    {
      key: 'size',
      label: 'Taille',
      type: 'select' as const,
      options: [
        { value: '1-10', label: '1-10 employés' },
        { value: '11-50', label: '11-50 employés' },
        { value: '51-200', label: '51-200 employés' },
        { value: '201-1000', label: '201-1000 employés' },
        { value: '1000+', label: '1000+ employés' }
      ]
    },
    {
      key: 'contact_person',
      label: 'Personne de contact',
      type: 'text' as const,
      placeholder: 'Nom de la personne de contact'
    }
  ];

  const editOrganizationFields = [
    ...organizationFields,
    {
      key: 'status',
      label: 'Statut',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'active', label: 'Actif' },
        { value: 'inactive', label: 'Inactif' },
        { value: 'pending', label: 'En attente' },
        { value: 'suspended', label: 'Suspendu' }
      ]
    },
    {
      key: 'subscription_plan',
      label: 'Plan d\'abonnement',
      type: 'select' as const,
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'professional', label: 'Professional' },
        { value: 'enterprise', label: 'Enterprise' }
      ]
    }
  ];

  const stats = [
    {
      title: "Organisations",
      value: totalCount.toString(),
      icon: Building2,
      color: "text-blue-500"
    },
    {
      title: "Actives",
      value: organizations.filter(o => o.status === 'active').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Utilisateurs totaux",
      value: organizations.reduce((sum, org) => sum + (org.user_count || 0), 0).toString(),
      icon: Users,
      color: "text-purple-500"
    },
    {
      title: "Équipes totales",
      value: organizations.reduce((sum, org) => sum + (org.team_count || 0), 0).toString(),
      icon: Settings,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tableau CRUD */}
      <CRUDTable
        title="Gestion des organisations"
        description="Gérez les organisations de vos clients"
        columns={columns}
        data={organizations}
        loading={loading}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        searchPlaceholder="Rechercher une organisation..."
        onSearch={setSearchTerm}
        onFilter={setFilters}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onCreate={() => setIsCreateModalOpen(true)}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onView={openViewModal}
        onRefresh={fetchData}
        selectable={true}
        onSelectionChange={setSelectedOrganizations}
        emptyState={{
          icon: Building2,
          title: "Aucune organisation",
          description: "Commencez par créer votre première organisation",
          action: {
            label: "Créer une organisation",
            onClick: () => setIsCreateModalOpen(true)
          }
        }}
        actions={[
          {
            label: "Gérer les équipes",
            icon: Settings,
            onClick: openTeamsModal,
            variant: "outline"
          },
          {
            label: "Dupliquer",
            icon: Copy,
            onClick: (org) => toast.info(`Duplication de ${org.name} en cours de développement`),
            variant: "outline"
          }
        ]}
      />

      {/* Utiliser les nouveaux formulaires depuis les pages dédiées */}

      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Détails de l'organisation</DialogTitle>
            <DialogDescription>
              Informations complètes de l'organisation
            </DialogDescription>
          </DialogHeader>
          {selectedOrganization && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="teams">Équipes</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                    <p className="font-medium">{selectedOrganization.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedOrganization.status)}
                      <Badge variant={getStatusColor(selectedOrganization.status)}>
                        {selectedOrganization.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-sm">{selectedOrganization.description || 'Aucune description'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Plan d'abonnement</Label>
                    <Badge variant="outline">
                      {selectedOrganization.subscription_plan || 'Basic'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Secteur</Label>
                    <p className="font-medium">{selectedOrganization.metadata?.industry || '-'}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedOrganization.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Téléphone</Label>
                    <p className="font-medium">{selectedOrganization.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Site web</Label>
                    {selectedOrganization.website ? (
                      <a 
                        href={selectedOrganization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {selectedOrganization.website}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Personne de contact</Label>
                    <p className="font-medium">{selectedOrganization.metadata?.contact_person || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Adresse</Label>
                    <p className="text-sm">
                      {selectedOrganization.address?.street && `${selectedOrganization.address.street}, `}
                      {selectedOrganization.address?.postal_code && `${selectedOrganization.address.postal_code} `}
                      {selectedOrganization.address?.city && `${selectedOrganization.address.city}, `}
                      {selectedOrganization.address?.state && `${selectedOrganization.address.state}, `}
                      {selectedOrganization.address?.country || ''}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="teams" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Équipes ({selectedOrganization.team_count || 0})</h3>
                  <Button size="sm" onClick={() => openTeamsModal(selectedOrganization)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Gérer les équipes
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  Cliquez sur "Gérer les équipes" pour voir les détails
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Utilisateurs</p>
                          <p className="text-2xl font-bold">{selectedOrganization.user_count || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Équipes</p>
                          <p className="text-2xl font-bold">{selectedOrganization.team_count || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'organisation "{selectedOrganization?.name}" ?
              {selectedOrganization?.user_count > 0 && (
                <span className="block mt-2 text-red-600">
                  Attention : {selectedOrganization.user_count} utilisateur(s) et {selectedOrganization.team_count} équipe(s) seront affectés.
                </span>
              )}
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedOrganization && deleteOrganization(selectedOrganization)}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de gestion des équipes */}
      <Dialog open={isTeamsModalOpen} onOpenChange={setIsTeamsModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestion des équipes</DialogTitle>
            <DialogDescription>
              Équipes de l'organisation "{selectedOrganization?.name}"
            </DialogDescription>
          </DialogHeader>
          {selectedOrganization && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Équipes ({teams.length})</h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle équipe
                </Button>
              </div>
              
              {teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune équipe trouvée
                </div>
              ) : (
                <div className="space-y-2">
                  {teams.map(team => (
                    <Card key={team.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{team.name}</h4>
                            {team.description && (
                              <p className="text-sm text-muted-foreground">{team.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{team.user_count || 0} utilisateurs</span>
                              </div>
                              <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                                {team.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations;