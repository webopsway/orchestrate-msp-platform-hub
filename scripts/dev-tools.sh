#!/bin/bash

# Outils de développement pour les deux portails
# Usage: ./scripts/dev-tools.sh [command]

set -e

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
    echo -e "${BLUE}🛠️  Outils de développement - Portails MSP & Client${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC} ./scripts/dev-tools.sh [command]"
    echo ""
    echo -e "${CYAN}Commandes disponibles:${NC}"
    echo ""
    echo -e "  ${GREEN}start${NC}           Lancer les deux portails en développement"
    echo -e "  ${GREEN}start-msp${NC}       Lancer uniquement MSP Admin"
    echo -e "  ${GREEN}start-client${NC}    Lancer uniquement Client Portal"
    echo -e "  ${GREEN}build${NC}           Builder les deux portails"
    echo -e "  ${GREEN}build-msp${NC}       Builder uniquement MSP Admin"
    echo -e "  ${GREEN}build-client${NC}    Builder uniquement Client Portal"
    echo -e "  ${GREEN}test${NC}            Lancer les tests des deux portails"
    echo -e "  ${GREEN}lint${NC}            Vérifier le code (linting)"
    echo -e "  ${GREEN}clean${NC}           Nettoyer les builds et node_modules"
    echo -e "  ${GREEN}status${NC}          Afficher le statut des processus de dev"
    echo -e "  ${GREEN}kill${NC}            Arrêter tous les processus de dev"
    echo -e "  ${GREEN}switch-msp${NC}      Ouvrir MSP Admin dans le navigateur"
    echo -e "  ${GREEN}switch-client${NC}   Ouvrir Client Portal dans le navigateur"
    echo -e "  ${GREEN}logs${NC}            Afficher les logs de développement"
    echo -e "  ${GREEN}setup${NC}           Configuration initiale du projet"
    echo ""
}

# Fonction pour démarrer les deux portails
start_both() {
    echo -e "${BLUE}🚀 Démarrage des deux portails...${NC}"
    echo -e "${YELLOW}📍 MSP Admin:${NC} http://localhost:3000"
    echo -e "${YELLOW}📍 Client Portal:${NC} http://localhost:3001"
    echo ""
    echo -e "${CYAN}💡 Tip: Utilisez Ctrl+C pour arrêter${NC}"
    echo ""
    
    # Créer les fichiers de logs
    mkdir -p logs
    
    npm run dev:both
}

# Fonction pour démarrer MSP uniquement
start_msp() {
    echo -e "${BLUE}🔧 Démarrage MSP Admin...${NC}"
    echo -e "${YELLOW}📍 URL:${NC} http://localhost:3000"
    echo ""
    
    npm run dev:msp-admin
}

# Fonction pour démarrer Client uniquement
start_client() {
    echo -e "${BLUE}👥 Démarrage Client Portal...${NC}"
    echo -e "${YELLOW}📍 URL:${NC} http://localhost:3001"
    echo ""
    
    npm run dev:client-portal
}

# Fonction de build
build_all() {
    echo -e "${BLUE}🔨 Build des deux portails...${NC}"
    
    echo -e "${YELLOW}📦 Building MSP Admin...${NC}"
    npm run build:msp-admin
    
    echo -e "${YELLOW}📦 Building Client Portal...${NC}"
    npm run build:client-portal
    
    echo -e "${GREEN}✅ Builds terminés!${NC}"
    echo -e "${CYAN}📁 MSP Admin:${NC} dist-msp-admin/"
    echo -e "${CYAN}📁 Client Portal:${NC} dist-client-portal/"
}

# Fonction de build MSP
build_msp() {
    echo -e "${BLUE}🔨 Build MSP Admin...${NC}"
    npm run build:msp-admin
    echo -e "${GREEN}✅ Build MSP terminé!${NC}"
    echo -e "${CYAN}📁 Output:${NC} dist-msp-admin/"
}

# Fonction de build Client
build_client() {
    echo -e "${BLUE}🔨 Build Client Portal...${NC}"
    npm run build:client-portal
    echo -e "${GREEN}✅ Build Client terminé!${NC}"
    echo -e "${CYAN}📁 Output:${NC} dist-client-portal/"
}

# Fonction de test
run_tests() {
    echo -e "${BLUE}🧪 Lancement des tests...${NC}"
    
    if command -v vitest &> /dev/null; then
        vitest run
    else
        echo -e "${YELLOW}⚠️  Vitest non installé, installation...${NC}"
        npm install -D vitest @vitest/ui
        vitest run
    fi
}

# Fonction de linting
run_lint() {
    echo -e "${BLUE}🔍 Vérification du code...${NC}"
    npm run lint
}

# Fonction de nettoyage
clean_all() {
    echo -e "${BLUE}🧹 Nettoyage...${NC}"
    
    echo -e "${YELLOW}🗑️  Suppression des builds...${NC}"
    rm -rf dist-msp-admin/ dist-client-portal/ dist/
    
    echo -e "${YELLOW}🗑️  Suppression des logs...${NC}"
    rm -rf logs/
    
    echo -e "${YELLOW}🗑️  Suppression node_modules...${NC}"
    rm -rf node_modules/
    
    echo -e "${YELLOW}📦 Réinstallation des dépendances...${NC}"
    npm install
    
    echo -e "${GREEN}✅ Nettoyage terminé!${NC}"
}

# Fonction de statut
show_status() {
    echo -e "${BLUE}📊 Statut des processus de développement${NC}"
    echo ""
    
    # Vérifier les ports
    echo -e "${YELLOW}🔍 Ports utilisés:${NC}"
    if lsof -i :3000 &> /dev/null; then
        echo -e "  ${GREEN}✅ Port 3000 (MSP):${NC} Actif"
    else
        echo -e "  ${RED}❌ Port 3000 (MSP):${NC} Libre"
    fi
    
    if lsof -i :3001 &> /dev/null; then
        echo -e "  ${GREEN}✅ Port 3001 (Client):${NC} Actif"
    else
        echo -e "  ${RED}❌ Port 3001 (Client):${NC} Libre"
    fi
    
    echo ""
    echo -e "${YELLOW}📁 Builds disponibles:${NC}"
    if [ -d "dist-msp-admin" ]; then
        echo -e "  ${GREEN}✅ MSP Admin:${NC} dist-msp-admin/"
    else
        echo -e "  ${RED}❌ MSP Admin:${NC} Non buildé"
    fi
    
    if [ -d "dist-client-portal" ]; then
        echo -e "  ${GREEN}✅ Client Portal:${NC} dist-client-portal/"
    else
        echo -e "  ${RED}❌ Client Portal:${NC} Non buildé"
    fi
}

# Fonction pour tuer les processus
kill_processes() {
    echo -e "${BLUE}🛑 Arrêt des processus de développement...${NC}"
    
    # Tuer les processus sur les ports 3000 et 3001
    if lsof -ti :3000 &> /dev/null; then
        lsof -ti :3000 | xargs kill -9
        echo -e "${GREEN}✅ Processus MSP (port 3000) arrêté${NC}"
    fi
    
    if lsof -ti :3001 &> /dev/null; then
        lsof -ti :3001 | xargs kill -9
        echo -e "${GREEN}✅ Processus Client (port 3001) arrêté${NC}"
    fi
    
    # Tuer les processus Vite
    pkill -f "vite" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Tous les processus arrêtés${NC}"
}

# Fonction pour ouvrir MSP dans le navigateur
open_msp() {
    echo -e "${BLUE}🔧 Ouverture MSP Admin...${NC}"
    
    if command -v open &> /dev/null; then
        open http://localhost:3000
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    else
        echo -e "${YELLOW}📍 URL MSP:${NC} http://localhost:3000"
    fi
}

# Fonction pour ouvrir Client dans le navigateur
open_client() {
    echo -e "${BLUE}👥 Ouverture Client Portal...${NC}"
    
    if command -v open &> /dev/null; then
        open http://localhost:3001
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3001
    else
        echo -e "${YELLOW}📍 URL Client:${NC} http://localhost:3001"
    fi
}

# Fonction pour afficher les logs
show_logs() {
    echo -e "${BLUE}📋 Logs de développement${NC}"
    echo ""
    
    if [ -d "logs" ]; then
        echo -e "${YELLOW}📁 Logs disponibles:${NC}"
        ls -la logs/
        echo ""
        echo -e "${CYAN}💡 Tip: tail -f logs/[file] pour suivre en temps réel${NC}"
    else
        echo -e "${YELLOW}⚠️  Aucun log trouvé${NC}"
    fi
}

# Fonction de setup initial
setup_project() {
    echo -e "${BLUE}⚙️  Configuration initiale du projet...${NC}"
    
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
    
    echo -e "${YELLOW}🔧 Vérification des configurations...${NC}"
    
    # Vérifier les fichiers de config
    if [ ! -f "vite.config.msp-admin.ts" ]; then
        echo -e "${RED}❌ vite.config.msp-admin.ts manquant${NC}"
        exit 1
    fi
    
    if [ ! -f "vite.config.client-portal.ts" ]; then
        echo -e "${RED}❌ vite.config.client-portal.ts manquant${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🏗️  Création des répertoires...${NC}"
    mkdir -p logs src/apps/msp-admin src/apps/client-portal
    
    echo -e "${GREEN}✅ Setup terminé!${NC}"
    echo ""
    echo -e "${CYAN}🚀 Commandes suivantes:${NC}"
    echo -e "  ./scripts/dev-tools.sh start    # Démarrer le développement"
    echo -e "  ./scripts/dev-tools.sh build    # Builder les applications"
}

# Menu principal
case "${1:-help}" in
    "start")
        start_both
        ;;
    "start-msp")
        start_msp
        ;;
    "start-client")
        start_client
        ;;
    "build")
        build_all
        ;;
    "build-msp")
        build_msp
        ;;
    "build-client")
        build_client
        ;;
    "test")
        run_tests
        ;;
    "lint")
        run_lint
        ;;
    "clean")
        clean_all
        ;;
    "status")
        show_status
        ;;
    "kill")
        kill_processes
        ;;
    "switch-msp"|"open-msp")
        open_msp
        ;;
    "switch-client"|"open-client")
        open_client
        ;;
    "logs")
        show_logs
        ;;
    "setup")
        setup_project
        ;;
    "help"|*)
        show_help
        ;;
esac 