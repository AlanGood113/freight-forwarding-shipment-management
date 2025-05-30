"use client";

import SummaryStats from "@/components/SummaryStats";
import ReceivedByCarrierChart from "@/components/ReceivedByCarrierChart";
import VolumeByModeChart from "@/components/VolumeByModeChart";
import ThroughputChart from "@/components/ThroughputChart";
import ShipmentTable from "@/components/ShipmentTable";
import ConsolidationRecommendations from "@/components/ConsolidationRecommendations";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-10">
      {" "}
      {/* Overall page styling */}
      {/* Main Dashboard Title */}
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-lg text-gray-600">
          Get a quick look at your key logistics metrics and recommendations.
        </p>
      </div>
      {/* Summary Statistics Section */}
      <section className="container mx-auto py-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-3">
          Summary Statistics
        </h2>
        <SummaryStats />
      </section>
      {/* Charts Section */}
      <section className="container mx-auto py-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-3">
          Operational Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {" "}
          {/* Responsive grid for charts */}
          <div className="col-span-1">
            <ReceivedByCarrierChart />
          </div>
          <div className="col-span-1">
            <VolumeByModeChart />
          </div>
        </div>
      </section>
      {/* Throughput Chart Section */}
      <section className="container mx-auto py-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-3">
          Throughput Performance
        </h2>
        <ThroughputChart />
      </section>
      {/* Shipment Table Section */}
      <section className="container mx-auto py-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-3">
          Recent Shipments
        </h2>
        <ShipmentTable />
      </section>
      {/* Consolidation Recommendations Section */}
      <section className="container mx-auto py-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-3">
          Consolidation Opportunities
        </h2>
        <ConsolidationRecommendations />
      </section>
    </div>
  );
}
