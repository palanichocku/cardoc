import { PageHeading } from "@/components/page-heading";
import { getCustomersForCurrentShop } from "@/lib/data/customers";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomersForCurrentShop();

  return (
    <>
      <PageHeading
        eyebrow="Directory"
        title="Customers"
        description="Customer profiles assigned to your current shop."
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          type="search"
          disabled
          placeholder="Search customers (coming soon)"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>

      {customers.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            No customers yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Customer records for this shop will appear here.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-200">
            {customers.map((customer) => (
              <li
                key={customer.id}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
              >
                <p className="font-semibold text-slate-950">
                  {customer.displayName}
                </p>
                <p className="truncate text-sm text-slate-600">
                  {customer.email ?? "No email"}
                </p>
                <p className="text-sm text-slate-600">
                  {customer.phone ?? "No phone"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
