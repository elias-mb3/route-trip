#!/usr/bin/env bash
# Atalhos via Podman: nada de Node, JDK ou Android SDK no host.
# Código montado do host (:Z por causa do SELinux); node_modules fica em volume.
set -euo pipefail
cd "$(dirname "$0")"
IMG=holambra-dev            # Node (web): dev, build, testes, scripts
IMG_AND=viagem-android      # Node + JDK 21 + Android SDK 36: APK
KEYS="$HOME/.android-keys"  # keystore persistida fora do repo (atualizar sem perder dados)

run() { podman run --rm $([ -t 0 ] && echo -it) -v "$PWD":/app:Z -v holambra-node-modules:/app/node_modules "$@"; }
run_and() {
  mkdir -p "$KEYS"
  podman run --rm $([ -t 0 ] && echo -it) --userns=keep-id -e HOME=/tmp/home -e ANDROID_USER_HOME=/keys \
    -e GRADLE_USER_HOME=/gradle \
    -v "$PWD":/app:Z -v viagem-android-node-modules:/app/node_modules:U \
    -v viagem-gradle:/gradle:U -v "$KEYS":/keys:Z "$IMG_AND" "$@"
}

case "${1:-dev}" in
  imagem)         podman build -t "$IMG" . ;;
  imagem-android) podman build -t "$IMG_AND" -f Containerfile.android . ;;
  install)        run "$IMG" npm install ;;
  dev)            run -p 127.0.0.1:5173:5173 "$IMG" ;;
  exemplo)        run "$IMG" npm run --silent exemplo ;;
  build)          run "$IMG" npm run build ;;
  test)           run "$IMG" npm test ;;
  validar)        shift; run "$IMG" npm run --silent validar -- "$@" ;;
  pacote)         shift; run "$IMG" npm run --silent pacote -- "$@" ;;
  schema)         run "$IMG" npm run --silent schema ;;
  preview)        run -p 127.0.0.1:4173:4173 "$IMG" sh -c 'npm run build && npm run preview -- --host 0.0.0.0' ;;
  shell)          run "$IMG" sh ;;
  shell-android)  run_and bash ;;
  apk)
    run_and bash -c 'set -e; npm install --no-audit --no-fund; npm run build:android; npx cap sync android;
      cd android && ./gradlew --no-daemon assembleDebug; cp app/build/outputs/apk/debug/app-debug.apk ../viagem-debug.apk'
    ls -lh viagem-debug.apk ;;
  imagem-emulador) podman build -t viagem-emulador -f Containerfile.emulador . ;;
  emulador)
    # Emulador Android (API 36) com KVM. A tela sai por VNC e aparece no navegador (noVNC):
    #   http://localhost:6080/vnc.html?autoconnect=1&resize=scale
    # Aparelho virtual com tela do Galaxy A35. Depois: ./dev.sh instalar
    podman rm -f viagem-emulador viagem-novnc >/dev/null 2>&1 || true
    podman run -d --name viagem-emulador --userns=keep-id --network=host --device /dev/kvm \
      -e HOME=/tmp/home -e ANDROID_AVD_HOME=/avd -e DISPLAY=:99 \
      -v viagem-avd:/avd:U viagem-emulador bash -c 'mkdir -p /tmp/home/.android;
        [ -d /avd/A35.avd ] || { echo no | avdmanager create avd -n A35 -k "system-images;android-36;google_apis;x86_64" -d pixel_7 >/dev/null;
          sed -i "s/^hw.lcd.width=.*/hw.lcd.width=1080/; s/^hw.lcd.height=.*/hw.lcd.height=2340/; s/^hw.lcd.density=.*/hw.lcd.density=450/; s/^hw.keyboard=.*/hw.keyboard=yes/" /avd/A35.avd/config.ini; }
        rm -rf /avd/A35.avd/*.lock;
        Xvfb :99 -screen 0 720x1400x24 -nolisten tcp & sleep 1;
        x11vnc -display :99 -forever -shared -nopw -localhost -rfbport 5900 -quiet &
        exec emulator -avd A35 -gpu swangle_indirect -no-audio -no-boot-anim -no-snapshot-save' >/dev/null
    podman run -d --name viagem-novnc --network=host viagem-novnc websockify --web /usr/share/novnc 127.0.0.1:6080 localhost:5900 >/dev/null
    echo "Emulador ligando (~1–2 min). Veja em: http://localhost:6080/vnc.html?autoconnect=1&resize=scale"
    echo "Depois: ./dev.sh instalar" ;;
  instalar)
    podman cp viagem-debug.apk viagem-emulador:/tmp/app.apk
    podman exec viagem-emulador bash -c 'adb wait-for-device; until [ "$(adb shell getprop sys.boot_completed | tr -d "\r")" = 1 ]; do sleep 2; done;
      adb install -r /tmp/app.apk && adb shell monkey -p br.dev.viagem.app 1 >/dev/null' ;;
  emulador-parar) podman rm -f viagem-emulador viagem-novnc >/dev/null ;;
  imagem-novnc)   podman build -t viagem-novnc -f Containerfile.novnc . ;;
  adb)            shift; podman run --rm $([ -t 0 ] && echo -it) --network=host --userns=keep-id -e HOME=/tmp/home \
                    -v "$PWD":/app:Z -v "$HOME/.android":/tmp/home/.android:Z "$IMG_AND" adb "$@" ;;
  *) echo "uso: ./dev.sh [imagem|imagem-android|install|dev|build|test|validar|pacote|schema|apk|emulador|instalar|emulador-parar|imagem-emulador|adb|preview|shell|shell-android]"; exit 1 ;;
esac
