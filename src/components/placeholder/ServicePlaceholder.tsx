import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ServicePlaceholderProps {
  title: string;
  description?: string;
}

export const ServicePlaceholder: React.FC<ServicePlaceholderProps> = ({ 
  title, 
  description = "Ce service est temporairement indisponible en raison de la migration de la base de données." 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            {description}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};