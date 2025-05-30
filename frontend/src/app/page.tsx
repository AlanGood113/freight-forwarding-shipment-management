// src/app/page.tsx
"use client";

import SummaryStats from "@/components/SummaryStats";
import ReceivedByCarrierChart from "@/components/ReceivedByCarrierChart";
import VolumeByModeChart from "@/components/VolumeByModeChart";
import ThroughputChart from "@/components/ThroughputChart";
import ShipmentTable from "@/components/ShipmentTable";
import ConsolidationRecommendations from "@/components/ConsolidationRecommendations";

export default function DashboardPage() {
  return (
    <div className="p-10 space-y-12">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* 1. Summary */}
      <section>
        <h2 className="text-2xl mb-4">Summary Statistics</h2>
        <SummaryStats />
      </section>

      {/* 2. Charts */}
      <section className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl mb-2">Received Shipments by Carrier</h3>
          <ReceivedByCarrierChart />
        </div>
        <div>
          <h3 className="text-xl mb-2">Volume by Mode</h3>
          <VolumeByModeChart />
        </div>
      </section>

      <section>
        <h3 className="text-xl mb-2">Warehouse Throughput Over Time</h3>
        <ThroughputChart />
      </section>

      <section>
        <h3 className="text-xl mb-2">Shipment Table</h3>
        <ShipmentTable />
      </section>

      <section>
        <h3 className="text-xl mb-2">Consolidation Recommendations</h3>
        <ConsolidationRecommendations />
      </section>
    </div>
  );
}
