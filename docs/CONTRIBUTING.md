# Guide de contribution — CRM Mondial Home

## Conventions de code

### Nommage

| Type                    | Convention       | Exemple             |
| ----------------------- | ---------------- | ------------------- |
| Composants React        | PascalCase       | `ClientCard.tsx`    |
| Fichiers non-composants | kebab-case       | `use-clients.ts`    |
| Variables / fonctions   | camelCase        | `fetchClients()`    |
| Constantes              | UPPER_SNAKE_CASE | `MAX_CAMPAIGN_SIZE` |
| Types / Interfaces      | PascalCase       | `type ClientDTO`    |

### TypeScript

- Mode strict activé — zéro `any` toléré
- `type` préféré à `interface` pour les données
- `interface` pour les contrats (providers, services)
- Imports de type via `import type { ... }`

### Composants

- Server Component par défaut
- Ajouter `"use client"` uniquement si hooks/état/event handlers nécessaires
- Max 200 lignes par composant — décomposer sinon
- Props interface déclarée juste avant le composant

### Server Actions

```typescript
"use server";

export async function createClient(input: unknown) {
  // 1. Auth
  await requireAuth();
  // 2. Permission
  await checkPermission(PERMISSIONS.CLIENTS_CREATE);
  // 3. Validate
  const data = createClientSchema.parse(input);
  // 4. Business logic
  return clientService.create(data);
}
```

## Workflow Git

```bash
# Feature
git checkout -b feat/nom-feature
git commit -m "feat: description courte"
git push origin feat/nom-feature
# → PR vers main

# Fix
git checkout -b fix/nom-bug
git commit -m "fix: description du bug corrigé"
```

### Convention commits (Conventional Commits)

```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation uniquement
style: formatage, pas de changement logique
refactor: refactoring sans nouvelle feature ni bug fix
perf: amélioration de performance
test: ajout/modification de tests
build: système de build, dépendances
ci: configuration CI/CD
chore: maintenance
```

## Tests

- Tests unitaires pour les `services/` et `schemas/`
- Tests E2E pour les flux critiques (auth, création client, envoi campagne)
- Pas de mock DB — utiliser une DB de test dédiée

## Revue de code

- Tout changement passe par une PR
- 1 review minimum
- `pnpm type-check` doit passer
- `pnpm lint` doit passer
- `pnpm test` doit passer
