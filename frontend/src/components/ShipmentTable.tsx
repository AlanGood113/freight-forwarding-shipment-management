/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import {
  Filter, // For the filter section heading
  Loader2, // For loading state
  AlertTriangle, // For error state
  ChevronLeft, // For pagination previous button
  ChevronRight, // For pagination next button
  Package, // For table header, maybe
} from "lucide-react";

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
  total_count: number; // Assuming your API returns total count for better pagination
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
  const [totalShipments, setTotalShipments] = useState(0); // For total count for pagination
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [destinationFilter, setDestinationFilter] = useState<string | "">("");
  const [carrierFilter, setCarrierFilter] = useState<string | "">("");

  // Helper to format date for better readability (optional)
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString; // Fallback if date is invalid
    }
  };

  useEffect(() => {
    async function fetchShipments() {
      setLoading(true);
      setError(null);
      setShipments([]); // Clear shipments on new fetch
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
        if (!res.ok)
          throw new Error(
            `Failed to fetch shipments: HTTP status ${res.status}`
          );
        const json: ShipmentsResponse = await res.json();
        setShipments(json.shipments);
        const total = json.total_count ?? json.shipments.length;
        setTotalShipments(total);
      } catch (e: any) {
        setError(e.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchShipments();
  }, [page, statusFilter, destinationFilter, carrierFilter, pageSize]);

  const totalPages = Math.ceil(totalShipments / pageSize);

  // Function to get status-specific styling
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "intransit":
        return "bg-blue-100 text-blue-800";
      case "received":
        return "bg-purple-100 text-purple-800";
      case "delayed": // If you add a delayed status later
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl space-y-6">
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <Filter className="h-6 w-6 text-indigo-500" />
          Filter Shipments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700 hover:border-gray-400 transition"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={destinationFilter}
            onChange={(e) => {
              setPage(1);
              setDestinationFilter(e.target.value);
            }}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700 hover:border-gray-400 transition"
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
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700 hover:border-gray-400 transition"
          >
            <option value="">All Carriers</option>
            {CARRIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm text-indigo-700">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-xl font-semibold mt-3">Loading Shipments...</p>
          <p className="text-sm mt-1 text-indigo-600">
            Fetching the latest shipment data.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg shadow-sm text-red-700">
          <AlertTriangle className="h-10 w-10 mb-3 text-red-500" />
          <p className="text-xl font-semibold">Error Loading Shipments</p>
          <p className="text-sm mt-1 text-red-600">{error}</p>
          <p className="text-xs mt-2">
            Please try refreshing the page or check your API URL.
          </p>
        </div>
      )}

      {/* Shipment Table */}
      {!loading && !error && shipments.length > 0 && (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="py-3 px-6">
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" /> ID
                  </span>
                </th>
                <th scope="col" className="py-3 px-6">
                  Customer
                </th>
                <th scope="col" className="py-3 px-6">
                  Origin
                </th>
                <th scope="col" className="py-3 px-6">
                  Destination
                </th>
                <th scope="col" className="py-3 px-6">
                  Carrier
                </th>
                <th scope="col" className="py-3 px-6">
                  Status
                </th>
                <th scope="col" className="py-3 px-6">
                  Arrival Date
                </th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr
                  key={s.shipment_id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    #{s.shipment_id}
                  </td>
                  <td className="py-4 px-6">{s.customer_id}</td>
                  <td className="py-4 px-6">{s.origin}</td>
                  <td className="py-4 px-6">{s.destination}</td>
                  <td className="py-4 px-6">{s.carrier}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(
                        s.status
                      )}`}
                    >
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">{formatDate(s.arrival_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Shipments Found State */}
      {!loading && !error && shipments.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-lg shadow-sm text-blue-700">
          <Package className="h-10 w-10 mb-3 text-blue-500" />
          <p className="text-xl font-semibold">No Shipments Found</p>
          <p className="text-sm mt-1 text-blue-600">
            Adjust your filters or try again later.
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-2" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{(page - 1) * pageSize + 1}</span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(page * pageSize, totalShipments)}
                </span>{" "}
                of <span className="font-medium">{totalShipments}</span> results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-indigo-50 text-sm font-medium text-indigo-700">
                  {page}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
