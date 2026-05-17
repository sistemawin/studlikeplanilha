#!/bin/bash
set -euo pipefail

echo "🔍 Verificando componentes duplicados..."

# Coleta todos os arquivos .tsx em src/ e verifica basenames repetidos
DUPLICATES=$(find src -type f -name "*.tsx" | grep -v node_modules | xargs -I{} basename {} | sort | uniq -d)

if [ -n "$DUPLICATES" ]; then
  echo "❌ Nomes de componente duplicados encontrados:"
  echo "$DUPLICATES"
  echo ""
  echo "Caminhos completos:"
  for dup in $DUPLICATES; do
    find src -type f -name "$dup" | grep -v node_modules
  done
  echo ""
  echo "❌ check:duplicates falhou. Cada componente deve ter nome único."
  exit 1
else
  echo "✅ Nenhum componente duplicado encontrado."
fi
