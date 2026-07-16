# Legacy cutover runbook

Car Doc uses one safe-by-default driver for legacy cutover. The source argument must point to the latest `Shopman32/data` folder. The driver reads that folder but never modifies it, and its output contains counts only.

## Dry-run

```sh
npm run legacy:cutover:dry-run -- --source /path/to/Shopman32/data
```

This is the default mode. It checks the database connection and required source files, reads DBF header row counts, and reports the operational rows that would be reset. It performs no writes.

## Snapshot

```sh
node --env-file=.env.local scripts/legacy-cutover.mjs --snapshot
```

## Confirmed reset and reload

Review the dry-run immediately before cutover. Then run:

```sh
node --env-file=.env.local scripts/legacy-cutover.mjs \
  --source /path/to/Shopman32/data \
  --reset-operational-data \
  --reload-legacy \
  --verify \
  --confirm RESET_CAR_DOC_OPERATIONAL_DATA
```

The confirmation phrase is mandatory. The reset preserves shops, memberships, staff invites, canned services, shop settings, Auth users, migrations, and database security configuration. It clears only operational/staging data before importing customers, vehicles, invoices, AR, and open repair orders in dependency order.

## Verify only

```sh
npm run legacy:cutover:verify
```

Verification reports counts only, confirms server-side Prisma access, and checks that all Prisma-managed public tables retain RLS with browser API privileges revoked.

Never place credentials in command arguments. `.env.local` is loaded by Node and its values are not printed.
