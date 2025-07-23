#!/bin/bash

# Script de déploiement Frontend Client/ESN Portal
# Usage: ./scripts/deploy-client.sh [production|staging]

set -e

ENV=${1:-staging}
echo "👥 Déploiement Frontend Client/ESN - Environnement: $ENV"

# Configuration par environnement
if [ "$ENV" = "production" ]; then
    CLIENT_SERVER="admin@192.168.1.101"
    CLIENT_DOMAINS="*.msp.com"
    CLIENT_PATH="/var/www/client-portal"
    TEST_DOMAIN="demo.msp.com"
elif [ "$ENV" = "staging" ]; then
    CLIENT_SERVER="admin@192.168.1.201"
    CLIENT_DOMAINS="*.staging.msp.com"
    CLIENT_PATH="/var/www/client-portal-staging"
    TEST_DOMAIN="demo.staging.msp.com"
else
    echo "❌ Environnement non reconnu: $ENV"
    echo "Usage: ./scripts/deploy-client.sh [production|staging]"
    exit 1
fi

echo "📋 Configuration:"
echo "  - Serveur: $CLIENT_SERVER"
echo "  - Domaines: $CLIENT_DOMAINS"
echo "  - Chemin: $CLIENT_PATH"
echo "  - Test URL: $TEST_DOMAIN"
echo ""

# 1. Nettoyage des builds précédents
echo "🧹 Nettoyage..."
rm -rf dist-client-portal/

# 2. Build de l'application Client Portal uniquement
echo "🔨 Build Frontend Client Portal..."
npm run build:client-portal

# Vérifier que le build a réussi
if [ ! -d "dist-client-portal" ]; then
    echo "❌ Échec du build Client Portal"
    exit 1
fi

echo "✅ Build Client Portal terminé"

# 3. Test de connectivité serveur
echo "🔍 Test de connectivité serveur Client..."
if ! ssh -o ConnectTimeout=10 $CLIENT_SERVER "echo 'Connexion OK'"; then
    echo "❌ Impossible de se connecter au serveur Client"
    exit 1
fi

# 4. Backup de la version actuelle
echo "💾 Backup de la version actuelle..."
ssh $CLIENT_SERVER "
    if [ -d '$CLIENT_PATH' ]; then
        sudo cp -r $CLIENT_PATH ${CLIENT_PATH}_backup_$(date +%Y%m%d_%H%M%S)
    fi
"

# 5. Création du répertoire de destination
echo "📁 Préparation du répertoire de destination..."
ssh $CLIENT_SERVER "
    sudo mkdir -p $CLIENT_PATH
    sudo chown -R www-data:www-data $CLIENT_PATH
"

# 6. Upload des fichiers
echo "📤 Upload des fichiers vers le serveur Client..."
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    dist-client-portal/ $CLIENT_SERVER:$CLIENT_PATH/

# 7. Configuration des permissions
echo "🔒 Configuration des permissions..."
ssh $CLIENT_SERVER "
    sudo chown -R www-data:www-data $CLIENT_PATH
    sudo find $CLIENT_PATH -type f -exec chmod 644 {} \;
    sudo find $CLIENT_PATH -type d -exec chmod 755 {} \;
"

# 8. Configuration optimisée pour les clients
echo "⚙️ Configuration optimisée pour les clients..."
ssh $CLIENT_SERVER "
    # Activation de la compression
    sudo sed -i 's/# gzip_vary on;/gzip_vary on;/' /etc/nginx/nginx.conf
    sudo sed -i 's/# gzip_comp_level 6;/gzip_comp_level 6;/' /etc/nginx/nginx.conf
    
    # Cache pour les assets statiques
    sudo tee $CLIENT_PATH/.htaccess > /dev/null << 'EOF'
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css \"access plus 1 year\"
    ExpiresByType application/javascript \"access plus 1 year\"
    ExpiresByType image/png \"access plus 1 year\"
    ExpiresByType image/jpg \"access plus 1 year\"
    ExpiresByType image/jpeg \"access plus 1 year\"
    ExpiresByType image/svg+xml \"access plus 1 year\"
    ExpiresByType application/woff2 \"access plus 1 year\"
</IfModule>
EOF
"

# 9. Test de l'application déployée
echo "🧪 Test de l'application déployée..."
if curl -f -s -o /dev/null "https://$TEST_DOMAIN"; then
    echo "✅ Application Client accessible"
else
    echo "⚠️  Application Client non accessible (vérifiez DNS/SSL)"
fi

# 10. Test des domaines multiples (si disponibles)
echo "🌐 Test des domaines multiples..."
for domain in "demo.msp.com" "test.msp.com" "client1.msp.com"; do
    if [ "$ENV" = "staging" ]; then
        domain="demo.staging.msp.com"
    fi
    
    if curl -f -s -o /dev/null "https://$domain" 2>/dev/null; then
        echo "  ✅ $domain accessible"
    else
        echo "  ⚠️  $domain non configuré ou inaccessible"
    fi
done

# 11. Redémarrage des services
echo "🔄 Redémarrage des services..."
ssh $CLIENT_SERVER "
    sudo systemctl reload nginx
    sudo systemctl status nginx --no-pager
"

# 12. Nettoyage du build local
echo "🧹 Nettoyage des fichiers temporaires..."
rm -rf dist-client-portal/

echo ""
echo "🎉 Déploiement Frontend Client/ESN terminé avec succès !"
echo "🌐 Domaines supportés: $CLIENT_DOMAINS"
echo "🧪 URL de test: https://$TEST_DOMAIN"
echo "📊 Vérifiez les logs du serveur si nécessaire"

# 13. Affichage des informations post-déploiement
echo ""
echo "📋 Commandes utiles post-déploiement:"
echo "  - Logs nginx: ssh $CLIENT_SERVER 'sudo tail -f /var/log/nginx/access.log'"
echo "  - Logs erreurs: ssh $CLIENT_SERVER 'sudo tail -f /var/log/nginx/error.log'"
echo "  - Restart nginx: ssh $CLIENT_SERVER 'sudo systemctl restart nginx'"
echo "  - Vérifier status: ssh $CLIENT_SERVER 'sudo systemctl status nginx'"

echo ""
echo "🔧 Configuration des nouveaux domaines clients:"
echo "  1. Ajouter le DNS: nouveau-client.msp.com → $CLIENT_SERVER"
echo "  2. Configurer le SSL: sudo certbot --nginx -d nouveau-client.msp.com"
echo "  3. Tester: curl -I https://nouveau-client.msp.com" 