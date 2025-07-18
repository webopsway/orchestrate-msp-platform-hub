import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Server, Rocket, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Applications() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Services Métiers',
      description: 'Gérez vos services métiers et leur criticité',
      icon: Layers,
      path: '/applications/business-services',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
    },
    {
      title: 'Applications', 
      description: 'Administrez vos applications et leurs configurations',
      icon: Server,
      path: '/applications/applications',
      color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
    },
    {
      title: 'Déploiements',
      description: 'Suivez les déploiements sur votre infrastructure cloud',
      icon: Rocket,
      path: '/applications/deployments', 
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications & Services"
        description="Centralisez la gestion de vos services métiers, applications et déploiements"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.path} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center mb-4`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate(section.path)}
                  className="w-full"
                  variant="outline"
                >
                  Accéder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}