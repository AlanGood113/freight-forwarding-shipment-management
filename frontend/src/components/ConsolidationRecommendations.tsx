/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Package, // Main icon for the component
  Search, // For filter button
  Download, // For export button
  Loader2, // For loading state
  AlertTriangle, // For error state
  ChevronLeft, // For pagination
  ChevronRight, // For pagination
} from "lucide-react";
import DatePicker from "react-datepicker"; // For date filtering
import "react-datepicker/dist/react-datepicker.css"; // DatePicker styles

type Group = {
  destination: string;
  departure_date: string;
  group_count: number;
  shipment_ids: string;
};

type ExportRequest = {
  scopes: {
    destination?: string;
    departure_date?: string;
  }[];
};

export default function ConsolidationRecommendations() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [destinationFilter, setDestinationFilter] = useState<string>("");
  const [departureDateFilter, setDepartureDateFilter] = useState<Date | null>(
    null
  ); // Use Date object for date filter

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can make this configurable if needed

  const api = process.env.NEXT_PUBLIC_API_URL!;

  // Format date to YYYY-MM-DD for API calls
  const formatDateToYYYYMMDD = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchGroups();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch groups with optional filters
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset to first page on new filter

    try {
      const params = new URLSearchParams();
      if (destinationFilter) params.append("destination", destinationFilter);
      const formattedDate = formatDateToYYYYMMDD(departureDateFilter);
      if (formattedDate) params.append("departure_date", formattedDate);

      const res = await fetch(
        `${api}/metrics/consolidation${params.toString() ? `?${params}` : ""}`
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setGroups(json.cargo_consolidation || []); // Ensure it's an array
    } catch (e: any) {
      console.error("Failed to fetch consolidation groups:", e);
      setError(`Failed to load data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate groups for display
  const paginatedGroups = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return groups.slice(indexOfFirstItem, indexOfLastItem);
  }, [groups, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(groups.length / itemsPerPage);
  }, [groups.length, itemsPerPage]);

  // Export current (or all) scopes as CSV
  const exportCSV = async () => {
    setError(null);
    try {
      // Build scopes array
      const body: ExportRequest = { scopes: [] };
      if (destinationFilter || departureDateFilter) {
        body.scopes.push({
          destination: destinationFilter || undefined,
          departure_date:
            formatDateToYYYYMMDD(departureDateFilter) || undefined,
        });
      }
      // If no filters are applied, the backend should ideally export all data.
      // Based on your original code, if scopes is empty, it exports all.
      // Always send a valid JSON shape
      const res = await fetch(`${api}/metrics/consolidation/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Export failed with status: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consolidation_report_${formatDateToYYYYMMDD(
        new Date()
      )}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("Failed to export CSV:", e);
      setError(`Export failed: ${e.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[500px] flex flex-col">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 rounded-full">
          <Package className="h-6 w-6 text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          Consolidation Recommendations
        </h2>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        {/* Destination Filter */}
        <div>
          <label
            htmlFor="destination-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Destination
          </label>
          <select
            id="destination-filter"
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
          >
            <option value="">All Destinations</option>
            {[
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
            ].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Departure Date Filter */}
        <div>
          <label
            htmlFor="departure-date-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Departure Date
          </label>
          <DatePicker
            id="departure-date-filter"
            selected={departureDateFilter}
            onChange={(date: Date | null) => setDepartureDateFilter(date)}
            dateFormat="yyyy-MM-dd"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer transition duration-150 ease-in-out"
            placeholderText="Select date"
            isClearable
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={fetchGroups}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out mt-auto"
        >
          <Search className="h-4 w-4 mr-2" />
          Filter
        </button>

        {/* Export Button */}
        <button
          onClick={exportCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out mt-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Loading, Error, and No Data States */}
      {loading && (
        <div className="flex flex-grow flex-col items-center justify-center text-blue-700 p-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-xl font-medium">Loading recommendations...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-grow flex-col items-center justify-center text-red-700 p-4">
          <AlertTriangle className="h-12 w-12 mb-3 text-red-500" />
          <p className="text-xl font-semibold">Error Loading Data</p>
          <p className="text-sm mt-1 text-red-600 text-center">{error}</p>
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div className="flex flex-grow flex-col items-center justify-center text-gray-700 p-4">
          <Package className="h-12 w-12 mb-3 text-gray-500" />
          <p className="text-xl font-semibold">No Consolidation Groups Found</p>
          <p className="text-sm mt-1 text-gray-600 text-center">
            Adjust your filters or try a different date range.
          </p>
        </div>
      )}

      {/* Table and Pagination */}
      {!loading && !error && groups.length > 0 && (
        <div className="flex flex-col flex-grow">
          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Destination
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Departure Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Count
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Shipment IDs
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedGroups.map((group, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {group.destination}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.departure_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.group_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 break-words max-w-xs">
                      {group.shipment_ids}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
              <button
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </button>
              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
