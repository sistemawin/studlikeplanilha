# Fluxo — Autenticação

## Ciclo de vida de sessão

```
1. App carrega → supabase.auth.getSession()
2. Se sessão existe → loadRemoteState(userId) → renderiza app
3. Se sem sessão → renderiza AuthScreen

4. onAuthStateChange listener (ativo sempre):
   - SIGNED_IN  → loadRemoteState → setAppState
   - SIGNED_OUT → limpa estado → AuthScreen
   - PASSWORD_RECOVERY → modo de reset de senha
```

## Modos de AuthScreen

```
"login"  → signInWithPassword({ email, password })
"signup" → signUp({ email, password })
"reset"  → resetPasswordForEmail(email) → link enviado
           → updateUser({ password }) → nova senha definida
```

## Admin

Usuários admin têm flag `isAdmin: true` em `auth.users.app_metadata`.
Admin pode visualizar estado de qualquer usuário (read-only mode via `adminView`).

## Segurança

- Senhas nunca armazenadas no frontend
- Confirmação de ação destrutiva (arquivar edital) requer re-autenticação via `getSupabasePasswordVerifierClient()`
- RLS no Supabase garante que usuário só acessa seu próprio `app_state`
