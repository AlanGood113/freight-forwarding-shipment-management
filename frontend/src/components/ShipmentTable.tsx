import { useEffect, useState } from "react";

interface Shipment {
  shipment_id: number;
  customer_id: number;
  origin: string;
  destination: string;
  weight: number;
  volume: number;
  carrier: string;
  mode: string;
  status: string;
  arrival_date: string;
  departure_date?: string;
  delivered_date?: string;
}

interface ShipmentsResponse {
  page: number;
  page_size: number;
  shipments: Shipment[];
}

const STATUSES = ["received", "intransit", "delivered"];
const DESTINATIONS = [
  "GUY",
  "SVG",
  "SLU",
  "BIM",
  "DOM",
  "GRD",
  "SKN",
  "ANU",
  "SXM",
  "FSXM",
];
const CARRIERS = ["FEDEX", "DHL", "USPS", "UPS", "AMAZON"];

export default function ShipmentTable() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [destinationFilter, setDestinationFilter] = useState<string | "">("");
  const [carrierFilter, setCarrierFilter] = useState<string | "">("");

  useEffect(() => {
    async function fetchShipments() {
      setLoading(true);
      setError(null);
      try {
        const api = process.env.NEXT_PUBLIC_API_URL!;
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
        });
        if (statusFilter) params.append("status", statusFilter);
        if (destinationFilter) params.append("destination", destinationFilter);
        if (carrierFilter) params.append("carrier", carrierFilter);

        const res = await fetch(
          `${api}/metrics/shipments?${params.toString()}`
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json: ShipmentsResponse = await res.json();
        setShipments(json.shipments);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchShipments();
  }, [page, statusFilter, destinationFilter, carrierFilter, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="border p-2 rounded"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={destinationFilter}
          onChange={(e) => {
            setPage(1);
            setDestinationFilter(e.target.value);
          }}
          className="border p-2 rounded"
        >
          <option value="">All Destinations</option>
          {DESTINATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={carrierFilter}
          onChange={(e) => {
            setPage(1);
            setCarrierFilter(e.target.value);
          }}
          className="border p-2 rounded"
        >
          <option value="">All Carriers</option>
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Customer</th>
              <th className="border px-2 py-1">Origin</th>
              <th className="border px-2 py-1">Destination</th>
              <th className="border px-2 py-1">Carrier</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Arrival</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.shipment_id} className="hover:bg-gray-100">
                <td className="border px-2 py-1">{s.shipment_id}</td>
                <td className="border px-2 py-1">{s.customer_id}</td>
                <td className="border px-2 py-1">{s.origin}</td>
                <td className="border px-2 py-1">{s.destination}</td>
                <td className="border px-2 py-1">{s.carrier}</td>
                <td className="border px-2 py-1 capitalize">{s.status}</td>
                <td className="border px-2 py-1">{s.arrival_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
