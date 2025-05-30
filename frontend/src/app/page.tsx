"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SummaryStats from "@/components/SummaryStats";
import ReceivedByCarrierChart from "@/components/ReceivedByCarrierChart";
import VolumeByModeChart from "@/components/VolumeByModeChart";
import ThroughputChart from "@/components/ThroughputChart";
import ShipmentTable from "@/components/ShipmentTable";
import ConsolidationRecommendations from "@/components/ConsolidationRecommendations";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkDb() {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL!;
        const res = await fetch(`${api}/admin/db-status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          exists: boolean;
          loaded: boolean;
          total_shipments: number;
        };
        if (!json.exists || !json.loaded) {
          router.push("/upload");
        } else {
          setChecking(false);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error("DB check failed:", e);
        setError(e.message || "Failed to verify database status.");
        setChecking(false);
      }
    }
    checkDb();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">Checking database status…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-lg text-gray-600">
          Get a quick look at your key logistics metrics and recommendations.
        </p>
      </div>

      {/* Summary Statistics */}
      <section className="container mx-auto py-8">
        <SummaryStats />
      </section>

      {/* Charts */}
      <section className="container mx-auto py-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <ReceivedByCarrierChart />
        <VolumeByModeChart />
      </section>

      {/* Throughput */}
      <section className="container mx-auto py-8">
        <ThroughputChart />
      </section>

      {/* Shipments Table */}
      <section className="container mx-auto py-8">
        <ShipmentTable />
      </section>

      {/* Consolidation Recommendations */}
      <section className="container mx-auto py-8">
        <ConsolidationRecommendations />
      </section>
    </div>
  );
}
