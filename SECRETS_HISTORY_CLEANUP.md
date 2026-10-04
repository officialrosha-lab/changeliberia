# Git history cleanup: purging leaked secrets

This repo's current `HEAD` no longer contains any live secret values (see
the security-hardening commit that scrubbed them from tracked docs/scripts).
However, the **git history** still contains them — in old commits that added
`.env.production` / `apps/api/.env.local.bak`, and in earlier revisions of
the Markdown docs before they were scrubbed. Rewriting history is the only
way to remove them from the repository itself.

**This step is intentionally not run by Claude.** Rewriting history and
force-pushing affects every collaborator, fork, and open PR — it needs a
human decision and a human's hands on the force-push.

## 0. Before you do anything: rotate the actual credentials

Scrubbing history does **not** un-leak a secret that may already have been
scraped, cached, or indexed elsewhere (GitHub's own secret-scanning, CI logs,
etc.). Rotate all 4 of these regardless of whether/when you do the history
rewrite below:

1. **Resend API keys** (two were leaked) — generate new ones in the Resend
   dashboard, update `RESEND_API_KEY` in Railway.
2. **Database password** — rotate the Postgres password in Railway, update
   `DATABASE_URL`.
3. **Redis password** — rotate in Railway, update `REDIS_URL`.
4. **JWT_SECRET** — generate a new value (`openssl rand -base64 32`), update
   in Railway. Note: rotating this invalidates every currently-issued JWT,
   logging out all users — coordinate with the JWT/refresh-token work in this
   same security pass if it hasn't shipped yet.

## 1. Install git-filter-repo

```bash
pip install git-filter-repo
# or: brew install git-filter-repo
```

## 2. Work on a fresh clone (not your working copy)

```bash
git clone https://github.com/officialrosha-lab/changeliberia.git changeliberia-filtered
cd changeliberia-filtered
```

## 3. Pass 1 — remove the two leaked .env files from all history

```bash
git filter-repo --invert-paths \
  --path .env.production \
  --path apps/api/.env.local.bak \
  --force
```

(These were added in commits `2cad29e3d72cbac16188db244d48c0de3c691cbe` and
`74da22776e0c94bdc1bacf8652274f91709f1556` respectively — `--path` removal
strips them from every commit, not just those two.)

## 4. Pass 2 — scrub the leaked secret strings wherever they appear inline

Several of the now-scrubbed-at-HEAD docs had the real secret values in
earlier revisions. **Do not paste the real values into this file or any
other tracked file** — GitHub's push protection will (correctly) block a
push containing them, and it defeats the purpose of this cleanup. Instead,
build `replacements.txt` locally (it's a throwaway working file, never
commit it) with one `old==>new` line per leaked value:

- Each of the 2 leaked Resend API keys (`re_...`) ==> `re_your_resend_api_key_here`
- The leaked `JWT_SECRET` value ==> `your_jwt_secret_here_min_32_chars_base64`
- The leaked Postgres password ==> `YOUR_PASSWORD`
- The leaked Redis password ==> `YOUR_PASSWORD`

The exact leaked values are visible in this branch's commit history prior to
the scrub commit (`git log -p -- RAILWAY_API_DEPLOYMENT_GUIDE.md`), or you
already have them from your own records since you're rotating them in step 0
anyway.

Then run:

```bash
git filter-repo --replace-text replacements.txt --force
```

(Replacing just the password/key substrings, rather than whole connection
strings, is simpler to get right in a replacements file and still fully
desensitizes every historical revision.)

## 5. Verify before pushing anywhere

```bash
# Run one check per line in your replacements.txt — substitute each real
# leaked value in place of <value>:
git log --all -p | grep -F "<value>" && echo "STILL PRESENT" || echo "clean"

# Plus confirm the .env files are gone from history entirely:
git log --all --name-only | grep -E "^(\.env\.production|apps/api/\.env\.local\.bak)$" && echo "STILL PRESENT" || echo "clean"
```

Every check should print `clean`. (Deliberately not pasting the real values
into this committed file — see the note in step 4.)

## 6. Force-push the rewritten history

`git filter-repo` removes the `origin` remote as a safety measure — re-add it
first:

```bash
git remote add origin https://github.com/officialrosha-lab/changeliberia.git
git push origin --force --all
git push origin --force --tags
```

## 7. After pushing

- Every existing clone/fork is now based on abandoned history. Anyone with a
  local clone should re-clone fresh rather than pulling.
- Any open pull requests based on the old history will likely show as
  conflicting or show a huge diff — close and recreate them against the new
  history if needed.
- If GitHub secret scanning flagged any of these secrets, confirm the alerts
  clear once the rewritten history is pushed (may take a few minutes).
- Delete this file once the rewrite is complete — it's a one-time runbook,
  not a doc meant to stick around with new secret-shaped placeholder strings
  in it.
