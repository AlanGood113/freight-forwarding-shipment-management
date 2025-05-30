/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import {
  Filter,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Info,
} from "lucide-react";
import ShipmentDetailsModal from "@/components/ShipmentDetailsModal";

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
  total_count: number;
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
  const [totalShipments, setTotalShipments] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [arrivalStart, setArrivalStart] = useState("");
  const [arrivalEnd, setArrivalEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

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
        if (arrivalStart) params.append("arrival_date_start", arrivalStart);
        if (arrivalEnd) params.append("arrival_date_end", arrivalEnd);
        if (searchTerm) params.append("search", searchTerm);

        const res = await fetch(`${api}/metrics/shipments?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ShipmentsResponse = await res.json();
        setShipments(json.shipments);
        setTotalShipments(json.total_count);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchShipments();
  }, [
    page,
    statusFilter,
    destinationFilter,
    carrierFilter,
    arrivalStart,
    arrivalEnd,
    searchTerm,
    pageSize,
  ]);

  const totalPages = Math.ceil(totalShipments / pageSize);
  const getStatusClass = (s: string) => {
    switch (s.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "intransit":
        return "bg-blue-100 text-blue-800";
      case "received":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      {/* Filters */}
      <div className="p-4 bg-gray-50 border rounded flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-700">
          <Filter className="h-6 w-6 text-indigo-500" />
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 w-full md:w-auto">
          <select
            className="px-3 py-2 border rounded"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded"
            value={destinationFilter}
            onChange={(e) => {
              setPage(1);
              setDestinationFilter(e.target.value);
            }}
          >
            <option value="">All Destinations</option>
            {DESTINATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded"
            value={carrierFilter}
            onChange={(e) => {
              setPage(1);
              setCarrierFilter(e.target.value);
            }}
          >
            <option value="">All Carriers</option>
            {CARRIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div>
            <label className="sr-only">Arrival From</label>
            <input
              type="date"
              className="px-3 py-2 border rounded w-full"
              value={arrivalStart}
              onChange={(e) => {
                setPage(1);
                setArrivalStart(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="sr-only">Arrival To</label>
            <input
              type="date"
              className="px-3 py-2 border rounded w-full"
              value={arrivalEnd}
              onChange={(e) => {
                setPage(1);
                setArrivalEnd(e.target.value);
              }}
            />
          </div>
          <input
            type="number"
            placeholder="Search ID or Cust"
            className="px-3 py-2 border rounded w-full"
            value={searchTerm}
            onChange={(e) => {
              setPage(1);
              setSearchTerm(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-8 bg-indigo-50 border rounded text-indigo-700 flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10" />
          <p className="mt-4 font-semibold">Loading Shipments…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-8 bg-red-50 border rounded text-red-700 flex flex-col items-center">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p className="font-semibold">Error Loading Shipments</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && shipments.length > 0 && (
        <div className="overflow-x-auto rounded shadow">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
              <tr>
                <th className="py-2 px-4">
                  <Package className="inline-block mr-1" />
                  ID
                </th>
                <th className="py-2 px-4">Customer</th>
                <th className="py-2 px-4">Origin</th>
                <th className="py-2 px-4">Destination</th>
                <th className="py-2 px-4">Carrier</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Arrival</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.shipment_id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium">#{s.shipment_id}</td>
                  <td className="py-2 px-4">{s.customer_id}</td>
                  <td className="py-2 px-4">{s.origin}</td>
                  <td className="py-2 px-4">{s.destination}</td>
                  <td className="py-2 px-4">{s.carrier}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(
                        s.status
                      )}`}
                    >
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-2 px-4">{formatDate(s.arrival_date)}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={async () => {
                        try {
                          const api = process.env.NEXT_PUBLIC_API_URL!;
                          const res = await fetch(
                            `${api}/metrics/shipments/${s.shipment_id}`
                          );
                          if (!res.ok) throw new Error(`Status ${res.status}`);
                          const detail = await res.json();
                          setSelectedShipment(detail);
                          setShowModal(true);
                        } catch (err) {
                          console.error("Fetch shipment failed:", err);
                        }
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="View details"
                    >
                      <Info />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Data */}
      {!loading && !error && shipments.length === 0 && (
        <div className="p-8 bg-blue-50 border rounded text-blue-700 flex flex-col items-center">
          <Package className="h-10 w-10 mb-2" />
          <p className="font-semibold">No Shipments Found</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border-t rounded-b">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing{" "}
            <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(page * pageSize, totalShipments)}
            </span>{" "}
            of <span className="font-medium">{totalShipments}</span> shipments
          </div>
          <nav className="inline-flex -space-x-px shadow-sm">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 border bg-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-1 border bg-indigo-50 text-indigo-700">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-3 py-1 border bg-white disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}

      <ShipmentDetailsModal
        shipment={selectedShipment}
        isOpen={showModal}
        setIsOpen={setShowModal}
      />
    </div>
  );
}
