"use client";

import { useMemo, useState } from "react";
import { createRepairOrder } from "@/app/(app)/repair-orders/actions";

type CustomerOption = {
  id: string;
  displayName: string;
  vehicles: Array<{
    id: string;
    year: number | null;
    make: string | null;
    model: string | null;
    licensePlate: string | null;
  }>;
};

export function NewRepairOrderForm({ customers }: { customers: CustomerOption[] }) {
  const initialCustomer = customers[0];
  const [customerId, setCustomerId] = useState(initialCustomer?.id ?? "");
  const [vehicleId, setVehicleId] = useState(
    initialCustomer?.vehicles[0]?.id ?? "",
  );
  const vehicles = useMemo(
    () => customers.find((customer) => customer.id === customerId)?.vehicles ?? [],
    [customerId, customers],
  );

  function selectCustomer(nextCustomerId: string) {
    const nextCustomer = customers.find(
      (customer) => customer.id === nextCustomerId,
    );
    setCustomerId(nextCustomerId);
    setVehicleId(nextCustomer?.vehicles[0]?.id ?? "");
  }

  return (
    <form action={createRepairOrder} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="customerId" className="block text-sm font-semibold text-slate-800">Customer</label>
        <select id="customerId" name="customerId" required value={customerId} onChange={(event) => selectCustomer(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100">
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="vehicleId" className="block text-sm font-semibold text-slate-800">Vehicle</label>
        <select id="vehicleId" name="vehicleId" required disabled={!vehicles.length} value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 disabled:bg-slate-100">
          {vehicles.map((vehicle) => {
            const description = [vehicle.year, vehicle.make, vehicle.model]
              .filter(Boolean)
              .join(" ") || "Vehicle details unavailable";
            const label = vehicle.licensePlate
              ? `${description} · ${vehicle.licensePlate}`
              : description;
            return <option key={vehicle.id} value={vehicle.id}>{label}</option>;
          })}
        </select>
      </div>
      <p className="text-sm text-slate-600">This creates a draft only. Parts, labor, and invoice finalization are not included yet.</p>
      <button type="submit" disabled={!customerId || !vehicleId} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300">Save draft</button>
    </form>
  );
}
