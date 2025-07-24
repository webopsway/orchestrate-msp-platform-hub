#!/bin/bash

# Script de démarrage pour l'architecture séparée MSP Platform
# Version: 2.0 - Avec gestion des conflits de ports

set -e

echo "🚀 Démarrage de l'architecture séparée complète..."

# Fonction pour vérifier si un port est libre
check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "⚠️  Port $port déjà utilisé, arrêt du processus..."
        kill $(lsof -ti:$port) 2>/dev/null || true
        sleep 2
    fi
}

# Fonction pour vérifier si un service répond
check_service() {
    local url=$1
    local name=$2
    if curl -s $url > /dev/null 2>&1; then
        echo "✅ $name est opérationnel"
        return 0
    else
        echo "❌ $name ne répond pas"
        return 1
    fi
}

# Vérifier et libérer les ports
echo "🔍 Vérification des ports..."
check_port 3002
check_port 3000
check_port 3001

# Démarrer l'API Backend
echo "📡 Démarrage API Backend (port 3002)..."
cd backend
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env manquant dans backend/"
    exit 1
fi

# Démarrer en arrière-plan
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre que l'API soit prête
echo "⏳ Attente de l'API Backend..."
sleep 5

if ! check_service "http://localhost:3002/health" "API Backend"; then
    echo "❌ Échec du démarrage de l'API Backend"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Démarrer MSP Admin Frontend
echo "🔧 Démarrage MSP Admin Frontend (port 3000)..."
if [ -d "msp-admin-frontend" ]; then
    cd msp-admin-frontend
    npm run dev > ../logs/msp-admin.log 2>&1 &
    MSP_PID=$!
    cd ..
else
    echo "⚠️  Répertoire msp-admin-frontend non trouvé"
fi

# Démarrer Client Portal Frontend
echo "👥 Démarrage Client Portal Frontend (port 3001)..."
if [ -d "client-portal-frontend" ]; then
    cd client-portal-frontend
    npm run dev > ../logs/client-portal.log 2>&1 &
    CLIENT_PID=$!
    cd ..
else
    echo "⚠️  Répertoire client-portal-frontend non trouvé"
fi

# Attendre que les frontends soient prêts
echo "⏳ Attente des frontends..."
sleep 5

# Créer le répertoire de logs s'il n'existe pas
mkdir -p logs

# Vérifications finales
echo ""
echo "🔍 Vérification des services..."
check_service "http://localhost:3002/health" "API Backend"
check_service "http://localhost:3000" "MSP Admin Frontend"
check_service "http://localhost:3001" "Client Portal Frontend"

echo ""
echo "✅ Architecture séparée démarrée avec succès !"
echo ""
echo "📊 Services disponibles :"
echo "📡 API Backend:           http://localhost:3002"
echo "🔧 MSP Admin Frontend:    http://localhost:3000"
echo "👥 Client Portal Frontend: http://localhost:3001"
echo ""
echo "📚 Ressources utiles :"
echo "📖 Documentation API:     http://localhost:3002/api"
echo "🔍 Health Check API:      http://localhost:3002/health"
echo "📋 Logs Backend:          tail -f logs/backend.log"
echo "📋 Logs MSP Admin:        tail -f logs/msp-admin.log"
echo "📋 Logs Client Portal:    tail -f logs/client-portal.log"
echo ""
echo "💡 Commandes utiles :"
echo "🛑 Arrêter tous: pkill -f 'node.*3000|node.*3001|node.*3002'"
echo "🔄 Redémarrer API: cd backend && npm run dev"
echo "🔧 Test API: curl http://localhost:3002/health"
echo ""
echo "🎯 L'architecture est prête pour le développement !"

# Garder le script actif pour afficher les logs
echo "📝 Affichage des logs en temps réel (Ctrl+C pour arrêter) :"
echo "=========================================================="

# Suivre les logs si les fichiers existent
if [ -f "logs/backend.log" ]; then
    tail -f logs/backend.log &
fi
