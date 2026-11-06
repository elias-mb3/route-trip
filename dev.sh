#!/usr/bin/env bash
# Atalhos via Podman: nada de Node, JDK ou Android SDK no host.
# Código montado do host (:Z por causa do SELinux); node_modules fica em volume.
set -euo pipefail
cd "$(dirname "$0")"
IMG=holambra-dev            # Node (web): dev, build, testes, scripts
IMG_AND=viagem-android      # Node + JDK 21 + Android SDK 36: APK
KEYS="$HOME/.android-keys"  # keystore persistida fora do repo (atualizar sem perder dados)

run() { podman run --rm -it -v "$PWD":/app:Z -v holambra-node-modules:/app/node_modules "$@"; }
run_and() {
  mkdir -p "$KEYS"
  podman run --rm -it --userns=keep-id -e HOME=/tmp/home -e ANDROID_USER_HOME=/keys \
    -e GRADLE_USER_HOME=/gradle \
    -v "$PWD":/app:Z -v viagem-android-node-modules:/app/node_modules:U \
    -v viagem-gradle:/gradle:U -v "$KEYS":/keys:Z "$IMG_AND" "$@"
}

case "${1:-dev}" in
  imagem)         podman build -t "$IMG" . ;;
  imagem-android) podman build -t "$IMG_AND" -f Containerfile.android . ;;
  install)        run "$IMG" npm install ;;
  dev)            run -p 5173:5173 "$IMG" ;;
  exemplo)        run "$IMG" npm run --silent exemplo ;;
  build)          run "$IMG" npm run build ;;
  test)           run "$IMG" npm test ;;
  validar)        shift; run "$IMG" npm run --silent validar -- "$@" ;;
  pacote)         shift; run "$IMG" npm run --silent pacote -- "$@" ;;
  schema)         run "$IMG" npm run --silent schema ;;
  preview)        run -p 4173:4173 "$IMG" sh -c 'npm run build && npm run preview -- --host 0.0.0.0' ;;
  shell)          run "$IMG" sh ;;
  shell-android)  run_and bash ;;
  apk)
    run_and bash -c 'set -e; npm install --no-audit --no-fund; npm run build:android; npx cap sync android;
      cd android && ./gradlew --no-daemon assembleDebug; cp app/build/outputs/apk/debug/app-debug.apk ../viagem-debug.apk'
    ls -lh viagem-debug.apk ;;
  adb)            shift; podman run --rm -it --network=host --userns=keep-id -e HOME=/tmp/home \
                    -v "$PWD":/app:Z -v "$HOME/.android":/tmp/home/.android:Z "$IMG_AND" adb "$@" ;;
  *) echo "uso: ./dev.sh [imagem|imagem-android|install|dev|build|test|validar|pacote|schema|apk|adb|tiles|preview|shell|shell-android]"; exit 1 ;;
esac
