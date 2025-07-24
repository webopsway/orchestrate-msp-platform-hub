#!/bin/bash

# Script de vérification de santé pour l'architecture séparée MSP Platform
# Version: 1.0

echo "🏥 Vérification de santé - Architecture Séparée MSP Platform"
echo "============================================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de résultats
api_status=0
msp_status=0
client_status=0
auth_status=0

# Fonction pour tester un service
test_service() {
    local url=$1
    local name=$2
    local expected=$3

    echo -n "🔍 Test $name... "

    if curl -s --max-time 5 "$url" | grep -q "$expected" 2>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ ÉCHEC${NC}"
        return 1
    fi
}

# Test de l'API Backend
echo "📡 Vérification API Backend (port 3002)"
echo "----------------------------------------"
test_service "http://localhost:3002/health" "API Backend Health" "success.*true"
api_status=$?

if [ $api_status -eq 0 ]; then
    echo -n "🔍 Test données utilisateurs... "
    if curl -s --max-time 5 -H "Authorization: Bearer dev" "http://localhost:3002/api/users" | grep -q "success.*true" 2>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        auth_status=0
    else
        echo -e "${RED}❌ ÉCHEC${NC}"
        auth_status=1
    fi

    echo -n "🔍 Test documentation API... "
    if curl -s --max-time 5 "http://localhost:3002/api" | grep -q "endpoints" 2>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Partiel${NC}"
    fi
fi

echo ""

# Test MSP Admin Frontend
echo "🔧 Vérification MSP Admin Frontend (port 3000)"
echo "------------------------------------------------"
test_service "http://localhost:3000" "MSP Admin Frontend" "html"
msp_status=$?

echo ""

# Test Client Portal Frontend
echo "👥 Vérification Client Portal Frontend (port 3001)"
echo "----------------------------------------------------"
test_service "http://localhost:3001" "Client Portal Frontend" "html"
client_status=$?

echo ""

# Résumé final
echo "📊 RÉSUMÉ DE SANTÉ"
echo "=================="

if [ $api_status -eq 0 ]; then
    echo -e "📡 API Backend:           ${GREEN}✅ OPÉRATIONNEL${NC}"
else
    echo -e "📡 API Backend:           ${RED}❌ HORS SERVICE${NC}"
fi

if [ $msp_status -eq 0 ]; then
    echo -e "🔧 MSP Admin Frontend:    ${GREEN}✅ OPÉRATIONNEL${NC}"
else
    echo -e "🔧 MSP Admin Frontend:    ${RED}❌ HORS SERVICE${NC}"
fi

if [ $client_status -eq 0 ]; then
    echo -e "👥 Client Portal Frontend: ${GREEN}✅ OPÉRATIONNEL${NC}"
else
    echo -e "👥 Client Portal Frontend: ${RED}❌ HORS SERVICE${NC}"
fi

if [ $auth_status -eq 0 ]; then
    echo -e "🔐 Authentification:      ${GREEN}✅ FONCTIONNELLE${NC}"
else
    echo -e "🔐 Authentification:      ${RED}❌ DÉFAILLANTE${NC}"
fi

echo ""

# Score global
total_tests=4
passed_tests=$((4 - api_status - msp_status - client_status - auth_status))

echo "🎯 Score global: $passed_tests/$total_tests services opérationnels"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 SYSTÈME COMPLÈTEMENT OPÉRATIONNEL${NC}"
    exit 0
elif [ $passed_tests -ge 3 ]; then
    echo -e "${YELLOW}⚠️  SYSTÈME PARTIELLEMENT OPÉRATIONNEL${NC}"
    exit 1
else
    echo -e "${RED}🚨 SYSTÈME EN PANNE${NC}"
    exit 2
fi
