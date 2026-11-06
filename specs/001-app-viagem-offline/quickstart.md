# Quickstart / Validação

Pré-requisito: só Podman no host.

1. **Exemplo valida**: `./dev.sh validar viagens/holambra` → `OK Holambra…`, exit 0.
2. **Erro legível**: trocar uma hora para `9h` → `dias[0].paradas[0].hora: use HH:MM`, exit 1.
3. **Pacote**: `./dev.sh pacote holambra` → `viagens/holambra.viagem.zip` ≤ 10 MB.
4. **Simulação**: `./dev.sh dev`, Chrome 384×832 → "Minhas viagens" → importar o zip → roteiro aparece. DevTools offline + reload → todas as telas com conteúdo, mapa sem cinza.
5. **Edição**: mudar hora de uma parada, adicionar gasto; recarregar → persistiu. Exportar → `validar` no arquivo exportado → OK.
6. **Reimportar**: marcar parada feita; reimportar o zip → marcação continua.
7. **APK**: `./dev.sh apk` → `viagem-debug.apk` ≤ 15 MB. Instalar (Quick Share ou `./dev.sh adb install -r`), importar, modo avião, repetir 4–5. Instalar de novo por cima → dados mantidos.
8. **IA**: em sessão nova do Claude Code: "crie viagens/teste seguindo viagens/COMO-PREENCHER.md" → `validar` passa sem ajuste manual.
