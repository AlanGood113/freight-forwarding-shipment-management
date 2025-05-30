"use client";
import { useEffect, useState } from "react";

type Summary = {
  total_shipments: number;
  on_time: number;
  delayed: number;
  warehouse_utilization: { total_volume: number; utilization_percent: number };
};

export default function SummaryStats() {
  const [stats, setStats] = useState<Summary | null>(null);
  const [err, setErr] = useState<string>();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/summary`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setStats)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <p className="text-red-600">Error: {err}</p>;
  if (!stats) return <p>Loading summary…</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white shadow rounded">
        <h3 className="font-medium">Total Shipments</h3>
        <p className="text-2xl">{stats.total_shipments}</p>
      </div>
      <div className="p-4 bg-white shadow rounded">
        <h3 className="font-medium">On-Time vs Delayed</h3>
        <p>
          {stats.on_time} vs {stats.delayed}
        </p>
      </div>
      <div className="p-4 bg-white shadow rounded">
        <h3 className="font-medium">Warehouse Utilization</h3>
        <p>{stats.warehouse_utilization.utilization_percent.toFixed(1)}%</p>
      </div>
    </div>
  );
}
