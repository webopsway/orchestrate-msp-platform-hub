#!/bin/bash

# Script d'arrêt pour l'architecture séparée MSP Platform
# Version: 1.0

echo "🛑 Arrêt de l'architecture séparée..."

# Fonction pour arrêter un service sur un port spécifique
stop_service() {
    local port=$1
    local name=$2

    if lsof -ti:$port > /dev/null 2>&1; then
        echo "🔄 Arrêt de $name (port $port)..."
        kill $(lsof -ti:$port) 2>/dev/null || true
        sleep 1

        # Forcer l'arrêt si nécessaire
        if lsof -ti:$port > /dev/null 2>&1; then
            echo "💀 Arrêt forcé de $name..."
            kill -9 $(lsof -ti:$port) 2>/dev/null || true
        fi
        echo "✅ $name arrêté"
    else
        echo "ℹ️  $name n'était pas en cours d'exécution"
    fi
}

# Arrêter les services
stop_service 3002 "API Backend"
stop_service 3000 "MSP Admin Frontend"
stop_service 3001 "Client Portal Frontend"

# Nettoyer les processus nodemon et vite restants
echo "🧹 Nettoyage des processus restants..."
pkill -f "nodemon.*backend" 2>/dev/null || true
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "vite.*3001" 2>/dev/null || true

# Attendre un peu pour s'assurer que tout est arrêté
sleep 2

# Vérification finale
echo ""
echo "🔍 Vérification de l'arrêt..."
if ! lsof -ti:3002,3000,3001 > /dev/null 2>&1; then
    echo "✅ Tous les services ont été arrêtés avec succès"
else
    echo "⚠️  Certains ports sont encore occupés :"
    lsof -ti:3002,3000,3001 2>/dev/null | while read pid; do
        ps -p $pid -o pid,comm,args 2>/dev/null || true
    done
fi

echo ""
echo "🎯 Architecture séparée arrêtée"
echo "💡 Pour redémarrer : ./scripts/dev-separated.sh"
