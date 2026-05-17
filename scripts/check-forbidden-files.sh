#!/bin/bash
set -euo pipefail

echo "🔍 Verificando arquivos proibidos..."

ERRORS=0

# Arquivos com espaço + número (ex: "page 2.tsx", "Component 2.ts")
SPACE_NUM=$(find src -type f \( -name "* [0-9]*" \) 2>/dev/null | grep -v node_modules || true)
if [ -n "$SPACE_NUM" ]; then
  echo "❌ Arquivos com espaço + número encontrados:"
  echo "$SPACE_NUM"
  ERRORS=$((ERRORS + 1))
fi

# Arquivos com "copy" ou "copia" no nome
COPY_FILES=$(find src -type f \( -iname "*copy*" -o -iname "*copia*" \) 2>/dev/null | grep -v node_modules || true)
if [ -n "$COPY_FILES" ]; then
  echo "❌ Arquivos com 'copy/copia' no nome:"
  echo "$COPY_FILES"
  ERRORS=$((ERRORS + 1))
fi

# Arquivos com "backup" no nome
BACKUP_FILES=$(find src -type f -iname "*backup*" 2>/dev/null | grep -v node_modules || true)
if [ -n "$BACKUP_FILES" ]; then
  echo "❌ Arquivos com 'backup' no nome:"
  echo "$BACKUP_FILES"
  ERRORS=$((ERRORS + 1))
fi

# Arquivos com sufixo "-old", "_old", ".old"
OLD_FILES=$(find src -type f \( -name "*-old.*" -o -name "*_old.*" \) 2>/dev/null | grep -v node_modules || true)
if [ -n "$OLD_FILES" ]; then
  echo "❌ Arquivos com sufixo '-old/_old' encontrados:"
  echo "$OLD_FILES"
  ERRORS=$((ERRORS + 1))
fi

# Arquivos com sufixo "-new", "_new"
NEW_FILES=$(find src -type f \( -name "*-new.*" -o -name "*_new.*" \) 2>/dev/null | grep -v node_modules || true)
if [ -n "$NEW_FILES" ]; then
  echo "❌ Arquivos com sufixo '-new/_new' encontrados:"
  echo "$NEW_FILES"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
  echo "✅ Nenhum arquivo proibido encontrado."
else
  echo ""
  echo "❌ check:forbidden-files falhou com $ERRORS problema(s). Renomeie ou remova os arquivos acima."
  exit 1
fi
