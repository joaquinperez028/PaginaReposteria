#!/bin/bash
# Stop hook: tipos + tests de recetario/. Da UNA oportunidad de corregir por turno.
INPUT=$(cat)
# Si ya se bloqueó una vez en este turno, deja terminar (evita bucles).
if echo "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then exit 0; fi
REPO="$CLAUDE_PROJECT_DIR"
# Sin cambios en recetario/ desde el último commit: nada que verificar.
if git -C "$REPO" diff --quiet HEAD -- recetario && [ -z "$(git -C "$REPO" ls-files --others --exclude-standard -- recetario)" ]; then exit 0; fi
cd "$REPO/recetario" || exit 0
if ! npx tsc --noEmit 1>&2 || ! npx vitest run 1>&2; then
  echo "Tipos o tests fallan. Si lo causaste vos, corregilo. Si no es tuyo, explicaselo al usuario y termina sin tocar ese codigo." >&2
  exit 2
fi
exit 0
