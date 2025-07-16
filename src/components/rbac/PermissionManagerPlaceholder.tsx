import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings } from 'lucide-react';

export const PermissionManagerPlaceholder = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Gestionnaire de permissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            Le gestionnaire de permissions est temporairement désactivé en raison de la migration de la base de données.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};