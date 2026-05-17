#!/bin/bash
set -euo pipefail

echo "🧪 Verificando cobertura de testes de domínio..."

MISSING=0
FOUND=0

# Para cada arquivo domain/*.ts (exceto testes), verifica se existe *.test.ts correspondente
for domain_file in src/features/*/domain/*.ts; do
  # Pula arquivos de teste
  if [[ "$domain_file" == *.test.ts ]]; then
    continue
  fi

  FOUND=$((FOUND + 1))
  test_file="${domain_file%.ts}.test.ts"

  if [ ! -f "$test_file" ]; then
    echo "❌ Teste ausente: $test_file"
    echo "   → Arquivo de domínio sem teste: $domain_file"
    MISSING=$((MISSING + 1))
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "⚠️  Nenhum arquivo domain/ encontrado em src/features/."
  exit 0
fi

if [ $MISSING -eq 0 ]; then
  echo "✅ Todos os $FOUND arquivo(s) de domínio têm testes correspondentes."
else
  echo ""
  echo "❌ check:domain falhou: $MISSING arquivo(s) de domínio sem teste."
  echo "   Crie um arquivo .test.ts ao lado de cada domain/ listado acima."
  exit 1
fi
