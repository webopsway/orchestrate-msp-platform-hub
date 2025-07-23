#!/bin/bash

# Script de déploiement pour serveurs séparés
# Usage: ./scripts/deploy-separated.sh [staging|production]

set -e

ENV=${1:-staging}
echo "🚀 Déploiement séparé MSP + ESN/Clients - Environnement: $ENV"

# Configuration par environnement
if [ "$ENV" = "production" ]; then
    MSP_SERVER="admin@192.168.1.100"
    CLIENT_SERVER="admin@192.168.1.101"
    MSP_DOMAIN="admin.msp.com"
    CLIENT_DOMAINS="*.msp.com"
elif [ "$ENV" = "staging" ]; then
    MSP_SERVER="admin@192.168.1.200"
    CLIENT_SERVER="admin@192.168.1.201"
    MSP_DOMAIN="admin-staging.msp.com"
    CLIENT_DOMAINS="*.staging.msp.com"
else
    echo "❌ Environnement non reconnu: $ENV"
    echo "Usage: ./scripts/deploy-separated.sh [staging|production]"
    exit 1
fi

echo "📋 Configuration déploiement séparé:"
echo "  🔧 Serveur MSP: $MSP_SERVER ($MSP_DOMAIN)"
echo "  👥 Serveur ESN/Clients: $CLIENT_SERVER ($CLIENT_DOMAINS)"
echo ""

# Fonction de déploiement parallèle
deploy_parallel() {
    echo "🔄 Lancement du déploiement parallèle..."
    
    # Déploiement MSP en arrière-plan
    (
        echo "🔧 [MSP] Déploiement du frontend MSP..."
        ./scripts/deploy-msp.sh $ENV
        echo "✅ [MSP] Déploiement MSP terminé"
    ) &
    MSP_PID=$!
    
    # Déploiement Client en arrière-plan
    (
        echo "👥 [CLIENT] Déploiement du frontend ESN/Clients..."
        ./scripts/deploy-client.sh $ENV
        echo "✅ [CLIENT] Déploiement ESN/Clients terminé"
    ) &
    CLIENT_PID=$!
    
    # Attendre les deux déploiements
    echo "⏳ Attente des déploiements parallèles..."
    
    wait $MSP_PID
    MSP_STATUS=$?
    
    wait $CLIENT_PID
    CLIENT_STATUS=$?
    
    # Vérifier les résultats
    if [ $MSP_STATUS -eq 0 ] && [ $CLIENT_STATUS -eq 0 ]; then
        echo "🎉 Déploiements parallèles réussis !"
        return 0
    else
        echo "❌ Échec d'un ou plusieurs déploiements"
        [ $MSP_STATUS -ne 0 ] && echo "  - MSP: ÉCHEC"
        [ $CLIENT_STATUS -ne 0 ] && echo "  - ESN/Clients: ÉCHEC"
        return 1
    fi
}

# Fonction de déploiement séquentiel (fallback)
deploy_sequential() {
    echo "🔄 Déploiement séquentiel (fallback)..."
    
    echo "🔧 Déploiement MSP Admin..."
    if ! ./scripts/deploy-msp.sh $ENV; then
        echo "❌ Échec du déploiement MSP"
        return 1
    fi
    
    echo "👥 Déploiement ESN/Clients..."
    if ! ./scripts/deploy-client.sh $ENV; then
        echo "❌ Échec du déploiement ESN/Clients"
        return 1
    fi
    
    echo "✅ Déploiement séquentiel terminé"
    return 0
}

# Tests de connectivité préalables
echo "🔍 Test de connectivité des serveurs..."

# Test serveur MSP
if ! ssh -o ConnectTimeout=10 $MSP_SERVER "echo 'MSP OK'" > /dev/null 2>&1; then
    echo "❌ Serveur MSP ($MSP_SERVER) inaccessible"
    exit 1
fi
echo "✅ Serveur MSP accessible"

# Test serveur Client
if ! ssh -o ConnectTimeout=10 $CLIENT_SERVER "echo 'CLIENT OK'" > /dev/null 2>&1; then
    echo "❌ Serveur ESN/Clients ($CLIENT_SERVER) inaccessible"
    exit 1
fi
echo "✅ Serveur ESN/Clients accessible"

# Déploiement principal
echo ""
if deploy_parallel; then
    echo ""
    echo "🎉 DÉPLOIEMENT SÉPARÉ RÉUSSI !"
    echo ""
    echo "📊 Résumé du déploiement:"
    echo "  🔧 MSP Admin: https://$MSP_DOMAIN"
    echo "  👥 ESN/Clients: https://$CLIENT_DOMAINS"
    echo ""
    echo "🧪 Tests de validation:"
    
    # Test MSP
    if curl -f -s -o /dev/null "https://$MSP_DOMAIN" 2>/dev/null; then
        echo "  ✅ MSP Admin accessible"
    else
        echo "  ⚠️  MSP Admin non accessible (vérifiez DNS/SSL)"
    fi
    
    # Test Clients (exemples)
    for domain in "demo" "test" "acme"; do
        if [ "$ENV" = "staging" ]; then
            test_url="https://${domain}.staging.msp.com"
        else
            test_url="https://${domain}.msp.com"
        fi
        
        if curl -f -s -o /dev/null "$test_url" 2>/dev/null; then
            echo "  ✅ $test_url accessible"
        else
            echo "  ⚠️  $test_url non configuré"
        fi
    done
    
    echo ""
    echo "📋 Commandes de monitoring:"
    echo "  - Logs MSP: ssh $MSP_SERVER 'sudo tail -f /var/log/nginx/msp-admin.access.log'"
    echo "  - Logs Clients: ssh $CLIENT_SERVER 'sudo tail -f /var/log/nginx/client-portal.access.log'"
    echo "  - Status serveurs: ssh $MSP_SERVER 'sudo systemctl status nginx' && ssh $CLIENT_SERVER 'sudo systemctl status nginx'"
    
else
    echo ""
    echo "❌ ÉCHEC DU DÉPLOIEMENT SÉPARÉ"
    echo ""
    echo "🔧 Tentative de récupération avec déploiement séquentiel..."
    
    if deploy_sequential; then
        echo "✅ Récupération réussie avec déploiement séquentiel"
    else
        echo "❌ Échec du déploiement séquentiel également"
        echo ""
        echo "🆘 Actions recommandées:"
        echo "  1. Vérifiez la connectivité SSH vers les serveurs"
        echo "  2. Vérifiez l'espace disque disponible"
        echo "  3. Consultez les logs de build local"
        echo "  4. Tentez un déploiement manuel"
        exit 1
    fi
fi

echo ""
echo "🎯 Architecture déployée:"
echo "┌─────────────────────────────────────────────┐"
echo "│  🔧 Serveur MSP ($MSP_SERVER)               │"
echo "│  ├─ Interface: Administration complète      │"
echo "│  ├─ Sécurité: IP restreintes               │"
echo "│  └─ URL: https://$MSP_DOMAIN                │"
echo "├─────────────────────────────────────────────┤"
echo "│  👥 Serveur ESN/Clients ($CLIENT_SERVER)    │"
echo "│  ├─ Interface: Portails client/ESN         │"
echo "│  ├─ Optimisation: Performance et cache     │"
echo "│  └─ URLs: https://$CLIENT_DOMAINS           │"
echo "├─────────────────────────────────────────────┤"
echo "│  🗄️  Backend: Supabase (cloud)              │"
echo "│  ├─ Database: PostgreSQL avec RLS          │"
echo "│  └─ Accès: Depuis les 2 serveurs           │"
echo "└─────────────────────────────────────────────┘" 