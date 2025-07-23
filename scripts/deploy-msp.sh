#!/bin/bash

# Script de déploiement Frontend MSP Admin
# Usage: ./scripts/deploy-msp.sh [production|staging]

set -e

ENV=${1:-staging}
echo "🔧 Déploiement Frontend MSP - Environnement: $ENV"

# Configuration par environnement
if [ "$ENV" = "production" ]; then
    MSP_SERVER="admin@192.168.1.100"
    MSP_DOMAIN="admin.msp.com"
    MSP_PATH="/var/www/msp-admin"
elif [ "$ENV" = "staging" ]; then
    MSP_SERVER="admin@192.168.1.200"
    MSP_DOMAIN="admin-staging.msp.com"
    MSP_PATH="/var/www/msp-admin-staging"
else
    echo "❌ Environnement non reconnu: $ENV"
    echo "Usage: ./scripts/deploy-msp.sh [production|staging]"
    exit 1
fi

echo "📋 Configuration:"
echo "  - Serveur: $MSP_SERVER"
echo "  - Domaine: $MSP_DOMAIN"
echo "  - Chemin: $MSP_PATH"
echo ""

# 1. Nettoyage des builds précédents
echo "🧹 Nettoyage..."
rm -rf dist-msp-admin/

# 2. Build de l'application MSP Admin uniquement
echo "🔨 Build Frontend MSP Admin..."
npm run build:msp-admin

# Vérifier que le build a réussi
if [ ! -d "dist-msp-admin" ]; then
    echo "❌ Échec du build MSP Admin"
    exit 1
fi

echo "✅ Build MSP Admin terminé"

# 3. Test de connectivité serveur
echo "🔍 Test de connectivité serveur MSP..."
if ! ssh -o ConnectTimeout=10 $MSP_SERVER "echo 'Connexion OK'"; then
    echo "❌ Impossible de se connecter au serveur MSP"
    exit 1
fi

# 4. Backup de la version actuelle
echo "💾 Backup de la version actuelle..."
ssh $MSP_SERVER "
    if [ -d '$MSP_PATH' ]; then
        sudo cp -r $MSP_PATH ${MSP_PATH}_backup_$(date +%Y%m%d_%H%M%S)
    fi
"

# 5. Création du répertoire de destination
echo "📁 Préparation du répertoire de destination..."
ssh $MSP_SERVER "
    sudo mkdir -p $MSP_PATH
    sudo chown -R www-data:www-data $MSP_PATH
"

# 6. Upload des fichiers
echo "📤 Upload des fichiers vers le serveur MSP..."
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    dist-msp-admin/ $MSP_SERVER:$MSP_PATH/

# 7. Configuration des permissions
echo "🔒 Configuration des permissions..."
ssh $MSP_SERVER "
    sudo chown -R www-data:www-data $MSP_PATH
    sudo find $MSP_PATH -type f -exec chmod 644 {} \;
    sudo find $MSP_PATH -type d -exec chmod 755 {} \;
"

# 8. Test de l'application déployée
echo "🧪 Test de l'application déployée..."
if curl -f -s -o /dev/null "https://$MSP_DOMAIN"; then
    echo "✅ Application MSP accessible"
else
    echo "⚠️  Application MSP non accessible (vérifiez DNS/SSL)"
fi

# 9. Nettoyage du build local
echo "🧹 Nettoyage des fichiers temporaires..."
rm -rf dist-msp-admin/

echo ""
echo "🎉 Déploiement Frontend MSP terminé avec succès !"
echo "🌐 URL: https://$MSP_DOMAIN"
echo "📊 Vérifiez les logs du serveur si nécessaire"

# 10. Affichage des informations post-déploiement
echo ""
echo "📋 Commandes utiles post-déploiement:"
echo "  - Logs nginx: ssh $MSP_SERVER 'sudo tail -f /var/log/nginx/error.log'"
echo "  - Restart nginx: ssh $MSP_SERVER 'sudo systemctl restart nginx'"
echo "  - Vérifier status: ssh $MSP_SERVER 'sudo systemctl status nginx'" 