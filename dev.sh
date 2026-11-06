#!/usr/bin/env bash
# Atalhos para usar o projeto via Podman (sem Node instalado no host).
# Código montado do host (:Z por causa do SELinux); node_modules fica num volume.
set -euo pipefail
cd "$(dirname "$0")"
IMG=holambra-dev
run() { podman run --rm -it -v "$PWD":/app:Z -v holambra-node-modules:/app/node_modules "$@"; }

case "${1:-dev}" in
  imagem)  podman build -t "$IMG" . ;;
  install) run "$IMG" npm install ;;
  dev)     run -p 5173:5173 "$IMG" ;;
  tiles)   run "$IMG" npm run tiles ;;
  build)   run "$IMG" npm run build ;;
  preview) run -p 4173:4173 "$IMG" sh -c 'npm run build && npm run preview -- --host 0.0.0.0' ;;
  shell)   run "$IMG" sh ;;
  *) echo "uso: ./dev.sh [imagem|install|dev|tiles|build|preview|shell]"; exit 1 ;;
esac
