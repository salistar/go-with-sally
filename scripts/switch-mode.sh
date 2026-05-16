#!/bin/bash
# GoWithSally Mobile - Mode Switcher
# Usage: ./scripts/switch-mode.sh [static|hybrid|production]

set -euo pipefail

MODE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "GoWithSally Mobile - Mode Switch"
echo "========================================="

case "$MODE" in
  static|offline)
    echo "Switching to STATIC (offline) mode..."
    cp "$PROJECT_DIR/.env.static" "$PROJECT_DIR/.env"
    echo "Mode: OFFLINE - Donnees simulees sur telephone"
    echo "Aucun backend requis"
    ;;
  hybrid)
    echo "Switching to HYBRID mode..."
    cp "$PROJECT_DIR/.env.hybrid" "$PROJECT_DIR/.env"
    echo "Mode: HYBRID - API + fallback simulation"
    echo "Backend Docker requis: docker compose up"
    ;;
  production|prod)
    echo "Switching to PRODUCTION mode..."
    cp "$PROJECT_DIR/.env.production" "$PROJECT_DIR/.env"
    echo "Mode: ONLINE - API production uniquement"
    echo "Backend cloud requis"
    ;;
  *)
    echo "Usage: $0 [static|hybrid|production]"
    echo ""
    echo "Modes disponibles:"
    echo "  static     - Donnees locales simulees (pas de backend)"
    echo "  hybrid     - API locale + fallback simulation"
    echo "  production - API production uniquement"
    exit 1
    ;;
esac

echo ""
echo "Fichier .env mis a jour!"
echo "Relancez l'app: npx expo start --clear"
echo "========================================="
