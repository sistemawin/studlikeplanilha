#!/bin/bash
set -euo pipefail

echo "🏗️  Verificando regras de arquitetura..."

ERRORS=0

# Regra 1: Nenhum import runtime de @supabase/supabase-js fora de services/supabase/
# (import type é permitido — é apagado pelo TypeScript e não cria dependência de runtime)
SUPABASE_RUNTIME=$(grep -rn "^import [^t].*from ['\"]@supabase\|^import t[^y].*from ['\"]@supabase" \
  src/features src/components src/app src/hooks src/store src/lib \
  --include="*.ts" --include="*.tsx" \
  2>/dev/null | grep -v "import type" | grep -v node_modules || true)

if [ -n "$SUPABASE_RUNTIME" ]; then
  echo "❌ Import runtime de @supabase/supabase-js fora de services/supabase/:"
  echo "$SUPABASE_RUNTIME"
  echo "   → Mova a lógica para src/services/supabase/"
  ERRORS=$((ERRORS + 1))
fi

# Regra 2: Sem console.log em arquivos não-teste
CONSOLE_LOGS=$(grep -rn "console\.log" src \
  --include="*.ts" --include="*.tsx" \
  2>/dev/null | grep -v "\.test\." | grep -v node_modules || true)

if [ -n "$CONSOLE_LOGS" ]; then
  echo "❌ console.log encontrado em código não-teste:"
  echo "$CONSOLE_LOGS"
  echo "   → Remova os console.log antes de commitar."
  ERRORS=$((ERRORS + 1))
fi

# Regra 3: Sem imports relativos profundos (3+ níveis: ../../../)
# Use sempre @/ em vez de caminhos relativos entre features
DEEP_IMPORTS=$(grep -rn "\.\./\.\./\.\." src \
  --include="*.ts" --include="*.tsx" \
  2>/dev/null | grep -v node_modules || true)

if [ -n "$DEEP_IMPORTS" ]; then
  echo "❌ Imports relativos profundos (../../../) encontrados — use @/ em vez disso:"
  echo "$DEEP_IMPORTS"
  ERRORS=$((ERRORS + 1))
fi

# Regra 4: Sem código comentado (blocos // ou /* com código real)
# Heurística: linhas comentadas que parecem código (contêm = ou () ou {})
# Aviso apenas — não bloqueia o build
COMMENTED_CODE=$(grep -rn "^[[:space:]]*//" src \
  --include="*.ts" --include="*.tsx" \
  2>/dev/null | grep -E "=|function|\(\)|const |let |return " | grep -v node_modules | grep -v "\.test\." | head -20 || true)

if [ -n "$COMMENTED_CODE" ]; then
  echo "⚠️  Possível código comentado encontrado (revisar manualmente):"
  echo "$COMMENTED_CODE"
  echo "   → Remova código comentado; use git para recuperar histórico."
fi

# Regra 5: Limite de tamanho de arquivos
# Ver docs/refactoring/LARGE_FILES_POLICY.md para política completa
#
# Allowlist: arquivos conhecidamente grandes com justificativa documentada
# Formato: caminho relativo a partir de src/
ALLOWLIST=(
  "app/page.tsx"                              # Orchestrador central — sendo reduzido gradualmente
  "features/statistics/components/Exams.tsx"  # Scheduled para refatoração (ver LARGE_FILES_AUDIT.md)
)

WARN_LINES=500
BLOCK_LINES=1100

SIZE_WARNINGS=""
SIZE_ERRORS=0

while IFS= read -r file; do
  # Pula arquivos de teste
  [[ "$file" == *.test.ts ]] || [[ "$file" == *.test.tsx ]] && continue

  # Verifica se está na allowlist
  in_allowlist=false
  rel="${file#src/}"
  for allowed in "${ALLOWLIST[@]}"; do
    if [[ "$rel" == "$allowed" ]]; then
      in_allowlist=true
      break
    fi
  done
  $in_allowlist && continue

  lines=$(wc -l < "$file")
  if [ "$lines" -gt "$BLOCK_LINES" ]; then
    echo "❌ Arquivo acima do limite de $BLOCK_LINES linhas: $file ($lines linhas)"
    echo "   → Refatore ou adicione à allowlist em scripts/check-architecture.sh"
    SIZE_ERRORS=$((SIZE_ERRORS + 1))
    ERRORS=$((ERRORS + 1))
  elif [ "$lines" -gt "$WARN_LINES" ]; then
    SIZE_WARNINGS="${SIZE_WARNINGS}\n  $file ($lines linhas)"
  fi
done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | sort)

if [ -n "$SIZE_WARNINGS" ]; then
  echo "⚠️  Arquivos acima de $WARN_LINES linhas (considere refatorar):"
  echo -e "$SIZE_WARNINGS"
fi

if [ $ERRORS -eq 0 ]; then
  echo "✅ Verificações de arquitetura passaram."
else
  echo ""
  echo "❌ check:architecture falhou com $ERRORS problema(s)."
  exit 1
fi
