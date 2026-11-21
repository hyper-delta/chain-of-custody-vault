# Chain-of-Custody Vault

Full-stack tamper-evident custody tracking for university lab samples and evidence files.

## Quick start

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Configure PostgreSQL and MongoDB URLs in `server/.env`, then run `npm run seed` to create reference data and demo accounts.

## Demo accounts

The seed script creates:

- `collector@vault.local` / `Collector123!`
- `analyst@vault.local` / `Analyst123!`
- `auditor@vault.local` / `Auditor123!`

## Key architectural decision

Per-item hash chains are protected by a PostgreSQL pessimistic row lock and an optimistic `expectedSeq` check. This serialises concurrent writes to the same item while allowing unrelated items to proceed independently.

The system is tamper-evident, not tamper-proof. Database administrators can change and recompute records, so external checkpoint hashes are a future P2 mitigation.

See `PROJECT_SPEC.md` for the complete specification.
