import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { getVehiclesForCurrentShop } from "@/lib/data/vehicles";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const vehicles = await getVehiclesForCurrentShop();

  return (
    <>
      <PageHeading
        eyebrow="Inventory"
        title="Vehicles"
        description="Vehicle records assigned to your current shop."
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="vehicle-search" className="sr-only">
          Search vehicles
        </label>
        <input
          id="vehicle-search"
          type="search"
          disabled
          placeholder="Search vehicles (coming soon)"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>

      {vehicles.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            No vehicles yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Vehicle records for this shop will appear here.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-200">
            {vehicles.map((vehicle) => {
              const description =
                [vehicle.year, vehicle.make, vehicle.model]
                  .filter(Boolean)
                  .join(" ") || "Unnamed vehicle";

              return (
                <li key={vehicle.id}>
                  <Link
                    href={`/vehicles/${vehicle.id}`}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <p className="font-semibold text-slate-950">{description}</p>
                    <p className="truncate text-sm text-slate-600">
                      VIN: {vehicle.vin ?? "Not recorded"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Plate: {vehicle.licensePlate ?? "Not recorded"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
