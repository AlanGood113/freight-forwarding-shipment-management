/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Package, // Main icon for the component
  Download, // For export button
  Loader2, // For loading state
  AlertTriangle, // For error state
  ChevronLeft, // For pagination
  ChevronRight, // For pagination
  CalendarDays, // For date picker icon
  ChevronDown, // For expanding rows
  ChevronUp, // For collapsing rows
} from "lucide-react"; // Removed Search icon
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Default DatePicker styles
import React from "react";

type ShipmentItem = { shipment_id: number; customer_id: number };

type Group = {
  destination: string;
  arrival_date: string;
  group_count: number;
  shipments: ShipmentItem[];
};

type ExportRequest = {
  scopes: {
    destination?: string;
    arrival_date?: string;
  }[];
};

export default function ConsolidationRecommendations() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [destinationFilter, setDestinationFilter] = useState<string>("");
  const [arrivalDateFilter, setArrivalDateFilter] = useState<Date | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can make this configurable if needed

  // State for expanded row
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

  const api = process.env.NEXT_PUBLIC_API_URL!;

  // Format Date → 'YYYY-MM-DD'
  const formatDateToYYYYMMDD = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Fetch groups with optional filters
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset to first page on new filter
    setExpandedRowIndex(null); // Collapse any expanded row on new fetch
    try {
      const params = new URLSearchParams();
      if (destinationFilter) params.append("destination", destinationFilter);
      const fmt = formatDateToYYYYMMDD(arrivalDateFilter);
      if (fmt) params.append("arrival_date", fmt);

      const url = `${api}/metrics/consolidation${
        params.toString() ? `?${params}` : ""
      }`;
      const res = await fetch(url);
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

  // *** NEW: Trigger fetchGroups when filter states change ***
  useEffect(() => {
    fetchGroups();
  }, [destinationFilter, arrivalDateFilter]); // Dependency array includes filter states

  // Paginate groups for display
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groups.slice(start, start + itemsPerPage);
  }, [groups, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(groups.length / itemsPerPage);
  }, [groups.length, itemsPerPage]);

  // Handle row expansion/collapse
  const toggleRow = (index: number) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index);
  };

  // Export CSV
  const exportCSV = async () => {
    setError(null);
    try {
      const body: ExportRequest = { scopes: [] };
      const fmt = formatDateToYYYYMMDD(arrivalDateFilter);
      if (destinationFilter || fmt) {
        body.scopes.push({
          destination: destinationFilter || undefined,
          arrival_date: fmt || undefined,
        });
      }
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
      a.download = `consolidation_report_${
        formatDateToYYYYMMDD(new Date()) || "date"
      }.csv`;
      document.body.append(a);
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
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
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

        {/* Arrival Date Filter */}
        <div>
          <label
            htmlFor="arrival-date-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Arrival Date
          </label>
          <div className="relative flex items-center">
            <DatePicker
              id="arrival-date-filter"
              selected={arrivalDateFilter}
              onChange={(date: Date | null) => setArrivalDateFilter(date)}
              dateFormat="yyyy-MM-dd"
              isClearable
              placeholderText="Select date"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer transition duration-150 ease-in-out"
              popperPlacement="bottom-end"
            />
            <CalendarDays className="absolute left-3 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Removed Filter Button */}
        {/*
        <button
          onClick={fetchGroups}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out mt-auto"
        >
          <Search className="h-4 w-4 mr-2" /> Filter
        </button>
        */}

        {/* Export Button */}
        <button
          onClick={exportCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out mt-auto"
        >
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </button>
      </div>

      {/* Loading, Error, and No Data States */}
      {loading && (
        <div className="flex flex-grow flex-col items-center justify-center text-indigo-700 p-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="mt-4 text-xl font-medium text-gray-700">
            Loading recommendations...
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-grow flex-col items-center justify-center text-red-700 p-4">
          <AlertTriangle className="h-12 w-12 mb-3 text-red-500" />
          <p className="text-xl font-semibold text-gray-800">
            Error Loading Data
          </p>
          <p className="text-sm mt-1 text-red-600 text-center">{error}</p>
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div className="flex flex-grow flex-col items-center justify-center text-gray-700 p-4">
          <Package className="h-12 w-12 mb-3 text-gray-500" />
          <p className="text-xl font-semibold text-gray-800">
            No Consolidation Groups Found
          </p>
          <p className="text-sm mt-1 text-gray-600 text-center">
            Adjust your filters or try a different date.
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
                    Arrival Date
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
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedGroups.map((g, i) => (
                  <React.Fragment key={i}>
                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {g.destination}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {g.arrival_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {g.group_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => toggleRow(i)}
                          className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full p-1"
                          aria-expanded={expandedRowIndex === i}
                          aria-controls={`details-row-${i}`}
                        >
                          {expandedRowIndex === i ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRowIndex === i && (
                      <tr id={`details-row-${i}`} className="bg-gray-50">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="p-4 bg-white rounded-md shadow-inner border border-gray-200">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">
                              Shipment Details for Destination: {g.destination},
                              Date: {g.arrival_date}
                            </h4>
                            {g.shipments.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {g.shipments.map((s) => (
                                  <div
                                    key={s.shipment_id}
                                    className="bg-gray-100 p-3 rounded-md border border-gray-200 text-sm"
                                  >
                                    <p className="font-medium text-gray-900">
                                      Shipment ID:{" "}
                                      <span className="font-bold">
                                        {s.shipment_id}
                                      </span>
                                    </p>
                                    <p className="text-gray-700">
                                      Customer ID:{" "}
                                      <span className="font-bold">
                                        {s.customer_id}
                                      </span>
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-600 italic">
                                No individual shipment details available for
                                this group.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
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
