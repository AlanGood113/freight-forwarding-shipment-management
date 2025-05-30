/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

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
  const [destinationFilter, setDestinationFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  const api = process.env.NEXT_PUBLIC_API_URL!;

  // Initial fetch
  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch groups with optional filters
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (destinationFilter) params.append("destination", destinationFilter);
      if (dateFilter) params.append("departure_date", dateFilter);

      const res = await fetch(
        `${api}/metrics/consolidation${params.toString() ? `?${params}` : ""}`
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setGroups(json.cargo_consolidation);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Export current (or all) scopes as CSV
  const exportCSV = async () => {
    setError(null);
    try {
      // Build scopes array
      const body: ExportRequest = { scopes: [] };
      if (destinationFilter || dateFilter) {
        body.scopes.push({
          destination: destinationFilter || undefined,
          departure_date: dateFilter || undefined,
        });
      }
      // Always send a valid JSON shape
      const res = await fetch(`${api}/metrics/consolidation/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Export failed ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "consolidation.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Consolidation Recommendations</h2>

      <div className="flex items-end space-x-4">
        <div>
          <label className="block text-sm font-medium">Destination</label>
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="border p-2 rounded w-40"
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
        <div>
          <label className="block text-sm font-medium">Departure Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <button
          onClick={fetchGroups}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Filter
        </button>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Export CSV
        </button>
      </div>

      {loading && <p>Loading recommendations…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading &&
        !error &&
        (groups.length ? (
          <table className="min-w-full border-collapse bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Destination</th>
                <th className="border px-3 py-2 text-left">Departure Date</th>
                <th className="border px-3 py-2 text-left">Count</th>
                <th className="border px-3 py-2 text-left">Shipment IDs</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{g.destination}</td>
                  <td className="border px-3 py-2">{g.departure_date}</td>
                  <td className="border px-3 py-2">{g.group_count}</td>
                  <td className="border px-3 py-2 text-sm text-gray-700">
                    {g.shipment_ids}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No consolidation groups found.</p>
        ))}
    </div>
  );
}
