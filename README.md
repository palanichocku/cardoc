# Car Doc

Car Doc is a serverless, cloud-first auto repair shop application built with
Next.js, TypeScript, Tailwind CSS, and the App Router.

## Development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run build
```

## Initial shop setup

After the shop fields have been migrated, run the idempotent setup seed:

~~~bash
npm run db:seed
~~~

The seed creates or updates only the configured Car Doc shop. It does not add
customers, vehicles, invoices, or legacy data.

The current project includes the application shell, Supabase authentication
foundation, and Prisma schema. Legacy data import is intentionally not included
yet.
