#!/bin/bash

# Script pour lancer les 3 projets séparés en développement
# Usage: ./scripts/dev-separated.sh

set -e

echo "🚀 Démarrage de l'architecture séparée complète..."
echo ""

# Fonction pour tuer les processus en cours
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    pkill -f "node.*3002" || true
    pkill -f "vite.*3000" || true
    pkill -f "vite.*3001" || true
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Démarrer l'API Backend
echo "📡 Démarrage API Backend (port 3002)..."
cd backend && npm run dev &
API_PID=$!

# Attendre que l'API soit prête
sleep 3

# Retourner au répertoire principal
cd ..

# Démarrer MSP Admin Frontend
echo "🔧 Démarrage MSP Admin Frontend (port 3000)..."
cd msp-admin-frontend && npm run dev &
MSP_PID=$!

# Retourner au répertoire principal
cd ..

# Démarrer Client Portal Frontend
echo "👥 Démarrage Client Portal Frontend (port 3001)..."
cd client-portal-frontend && npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ Tous les services sont démarrés !"
echo ""
echo "📡 API Backend:           http://localhost:3002"
echo "🔧 MSP Admin Frontend:    http://localhost:3000"
echo "👥 Client Portal Frontend: http://localhost:3001"
echo ""
echo "📖 Documentation API:     http://localhost:3002/api"
echo "🔍 Health Check:          http://localhost:3002/health"
echo ""
echo "💡 Tip: Utilisez Ctrl+C pour arrêter tous les services"
echo ""

# Attendre l'arrêt
wait $API_PID $MSP_PID $CLIENT_PID
