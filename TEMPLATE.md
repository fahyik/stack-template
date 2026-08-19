# Using this template

This file is meta — it documents the template itself, and `npm run init` deletes it. `README.md` is the README your generated project keeps.

## Create a project

```sh
gh repo create my-app --template <you>/stack-template --private --clone
cd my-app
npm run init
```

`init` runs on bare `node` (Node 24 strips the types), so it works **before** `npm install` and has no dependencies of its own.

### Non-interactive

```sh
npm run init -- --yes \
  --name acme --scope acme \
  --apps api,webapp,supabase \
  --no-mastra \
  --port-base 4000 --supabase-port-base 54440 \
  --firebase-prefix acme
```

| Flag                   | Meaning                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `--name`               | Project name, kebab-case. Also implies `--yes`.                     |
| `--scope`              | npm scope without the `@`. Defaults to `--name`.                    |
| `--apps`               | Comma-separated subset of `api,webapp,backoffice,landing,supabase`. |
| `--no-mastra`          | Drop the Mastra module.                                             |
| `--port-base`          | Web ports: landing +0, api +1, webapp +2, backoffice +3.            |
| `--supabase-port-base` | Supabase port block start.                                          |
| `--firebase-prefix`    | Fills `.firebaserc` ids; otherwise they stay `REPLACE_ME-*`.        |
| `--no-git`             | Skip the git re-init.                                               |
| `--dry-run`            | Print what would change, write nothing.                             |
| `--keep`               | Don't self-delete (for developing the template itself).             |

## How it works

**The template is a real, working repo, not a bag of `__PLACEHOLDER__` files.** It installs, lints, builds and tests under the `@repo/*` scope, and its own CI proves that on every push. That is the whole defense against template rot — a template nobody can run is a template nobody notices is broken.

So `init` is a rewriting step, not an assembly step:

1. **Delete** unselected apps, then the Mastra module if declined.
2. **Rewrite** these anchored tokens across an allowlist of text files:

   | Token                                    | Becomes                                           |
   | ---------------------------------------- | ------------------------------------------------- |
   | `@repo/`                                 | `@<scope>/`                                       |
   | `stack-template`                         | `<name>`                                          |
   | `stack-template-api`                     | `<name>-api`                                      |
   | `stack_template`                         | `<name_with_underscores>` (Supabase `project_id`) |
   | `REPLACE_ME-{webapp,backoffice,landing}` | `<firebase-prefix>-*`                             |

   Tokens are always matched with their punctuation (`@repo/`, not `repo`) so they can't collide with ordinary words.

3. **Assert** no token survived; exit non-zero if one did.
4. `npm install` for a fresh lockfile, `prettier --write`.
5. Delete itself and `TEMPLATE.md`, then `git init` + one commit.

Re-running is refused once `TEMPLATE.md` is gone. The git re-init is skipped if the repo has more than two commits, so running `init` in the wrong directory can't destroy real history.

## Optional modules

**Mastra** (embedded agent-workflow runtime in `apps/api`) is the only module today. It is wired inline — not parked in a staging directory — so it type-checks and builds like everything else. `init` removes it by deleting `apps/api/src/services/mastra/`, dropping its deps, and stripping paired comment markers:

```ts
// #region module:mastra
...
// #endregion module:mastra
```

Markers exist in `.ts`, `Dockerfile`, and `.gitignore` syntax. They are ordinary comments, so the template stays lint-clean with the module present.

Note `pg`, `pino` and `pino-pretty` belong to Mastra, not the api: `apps/api/src/db/index.ts` uses `postgres`, and the app logger is winston via `@repo/logger`. Mastra's logger needs pino specifically for `messageKey: "message"`, which is what GCP Cloud Logging reads. Removing the module removes all three.

To add another module, follow the same shape: inline code, region markers, and a branch in `removeMastra`-style logic in `scripts/init.ts`.

## Keeping the template healthy

- `.github/workflows/ci.yml` — what generated projects inherit: install, lint, build, test.
- `.github/workflows/template-selftest.yml` — template-only: runs `init` non-interactively across a matrix of answers and builds each result. `init` deletes this from generated projects.

When you change the template, run the selftest matrix locally before pushing:

```sh
rm -rf /tmp/t1 && cp -R . /tmp/t1 && cd /tmp/t1 && rm -rf node_modules .git
npm install
npm run init -- --yes --name t1 --scope t1 --no-git --no-mastra
npm install && npm run lint && npm run build && npm run test
```
