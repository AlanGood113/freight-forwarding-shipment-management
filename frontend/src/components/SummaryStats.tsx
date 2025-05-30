"use client";
import { useEffect, useState } from "react";
import {
  Package,
  Clock,
  Warehouse,
  AlertTriangle,
  Loader2,
} from "lucide-react"; // Import Lucide icons

type Summary = {
  total_shipments: number;
  on_time: number;
  delayed: number;
  warehouse_utilization: { total_volume: number; utilization_percent: number };
};

export default function SummaryStats() {
  const [stats, setStats] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null); // Initialize err with null for cleaner state management

  useEffect(() => {
    // Add a loading state for better UX
    setStats(null);
    setErr(null);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/summary`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(setStats)
      .catch((e) => {
        console.error("Failed to fetch summary stats:", e);
        setErr(`Failed to load data: ${e.message || String(e)}`);
      });
  }, []);

  if (err) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg shadow-sm text-red-700">
        <AlertTriangle className="h-10 w-10 mb-3 text-red-500" />
        <p className="text-xl font-semibold">Error Loading Data</p>
        <p className="text-sm mt-1 text-red-600">{err}</p>
        <p className="text-xs mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-600">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-xl font-semibold mt-3">Loading Summary...</p>
        <p className="text-sm mt-1">Fetching the latest metrics.</p>
      </div>
    );
  }

  // Determine color for warehouse utilization based on percentage
  const utilizationColor =
    stats.warehouse_utilization.utilization_percent > 90
      ? "text-red-600" // High utilization, potentially critical
      : stats.warehouse_utilization.utilization_percent > 75
      ? "text-orange-500" // Moderate to high utilization
      : "text-green-600"; // Low to moderate, good

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {/* Total Shipments Card */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start space-x-4 transition transform hover:scale-[1.02] duration-200 ease-in-out">
        <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-full">
          <Package className="h-7 w-7 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            Total Shipments
          </h3>
          <p className="text-4xl font-extrabold text-gray-800">
            {stats.total_shipments.toLocaleString()}
          </p>
        </div>
      </div>

      {/* On-Time vs Delayed Card */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start space-x-4 transition transform hover:scale-[1.02] duration-200 ease-in-out">
        <div className="flex-shrink-0 p-3 bg-green-100 rounded-full">
          <Clock className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            On-Time vs Delayed
          </h3>
          <p className="text-3xl font-bold text-gray-800">
            <span className="text-green-600">
              {stats.on_time.toLocaleString()}
            </span>{" "}
            <span className="text-gray-400 font-normal text-xl">vs</span>{" "}
            <span className="text-red-500">
              {stats.delayed.toLocaleString()}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ({((stats.on_time / stats.total_shipments) * 100).toFixed(1)}%
            On-Time)
          </p>
        </div>
      </div>

      {/* Warehouse Utilization Card */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start space-x-4 transition transform hover:scale-[1.02] duration-200 ease-in-out">
        <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full">
          <Warehouse className="h-7 w-7 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            Warehouse Utilization
          </h3>
          <p className={`text-4xl font-extrabold ${utilizationColor}`}>
            {stats.warehouse_utilization.utilization_percent.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">
            of {stats.warehouse_utilization.total_volume.toLocaleString()} units
          </p>
        </div>
      </div>
    </div>
  );
}
