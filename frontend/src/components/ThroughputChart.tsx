"use client";
import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Loader2,
  AlertTriangle,
  ChevronLeft, // For previous month
  ChevronRight, // For next month
} from "lucide-react";

// Defines the structure of your raw daily data points
type DailyPoint = { arrival_date: string; packages_received: number };

// Defines the structure of aggregated monthly data points
type MonthlyAggregatedData = { month: string; total_packages_received: number };

export default function ThroughputChart() {
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]); // Stores the raw daily data fetched from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); // Index for the current month being viewed

  useEffect(() => {
    setLoading(true);
    setError(null);
    setDailyData([]); // Clear previous data

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/throughput`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((json) => {
        if (Array.isArray(json.throughput) && json.throughput.length > 0) {
          // Sort daily data by date once fetched to ensure chronological order
          const sortedData = [...json.throughput].sort(
            (a: DailyPoint, b: DailyPoint) =>
              new Date(a.arrival_date).getTime() -
              new Date(b.arrival_date).getTime()
          );
          setDailyData(sortedData);
        } else {
          setDailyData([]);
          console.warn("API returned empty throughput array.");
        }
      })
      .catch((e) => {
        console.error("Failed to fetch throughput data:", e);
        setError(`Failed to load chart data: ${e.message || String(e)}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // --- Data Aggregation and Filtering Logic ---

  // Aggregates daily data into monthly totals for pagination purposes
  const monthlyAggregatedTotals: MonthlyAggregatedData[] = useMemo(() => {
    if (!dailyData.length) return [];

    const aggregated: { [key: string]: number } = {}; // Key format: YYYY-MM

    dailyData.forEach((point) => {
      const date = new Date(point.arrival_date);
      // Format month as YYYY-MM for consistent grouping
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      aggregated[monthKey] =
        (aggregated[monthKey] || 0) + point.packages_received;
    });

    // Convert aggregated object to array of MonthlyAggregatedData objects and sort by month
    const result = Object.keys(aggregated)
      .sort() // Sorts by YYYY-MM chronologically
      .map((key) => ({
        month: key, // Keep YYYY-MM format for internal use
        total_packages_received: aggregated[key],
      }));

    // Initialize currentMonthIndex to the latest month after data is loaded
    if (result.length > 0) {
      setCurrentMonthIndex(result.length - 1);
    }
    return result;
  }, [dailyData]); // Recalculate when dailyData changes

  // Filters the raw dailyData to get only the points for the currently selected month
  const currentMonthDailyData: DailyPoint[] = useMemo(() => {
    if (monthlyAggregatedTotals.length === 0) return [];

    // Get the current month's key (e.g., "2025-01") from the aggregated monthly data
    const selectedMonthKey = monthlyAggregatedTotals[currentMonthIndex]?.month;

    if (!selectedMonthKey) return []; // Ensure a month is selected

    // Filter the original daily data for the selected month to show daily trends
    return dailyData.filter((point) => {
      const pointDate = new Date(point.arrival_date);
      const pointMonthKey = `${pointDate.getFullYear()}-${(
        pointDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;
      return pointMonthKey === selectedMonthKey;
    });
  }, [monthlyAggregatedTotals, currentMonthIndex, dailyData]); // Recalculate when selected month or dailyData changes

  // Formats month key (YYYY-MM) for display in the header
  const getMonthDisplayName = (monthKey: string) => {
    if (!monthKey) return "";
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-indexed for Date object
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  // --- Pagination Handlers ---
  const handlePreviousMonth = () => {
    setCurrentMonthIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthIndex((prevIndex) =>
      Math.min(monthlyAggregatedTotals.length - 1, prevIndex + 1)
    );
  };

  // --- Custom Tooltip Component for Recharts ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Reformat the label (arrival_date) for display in the tooltip
      const formattedDate = new Date(label).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      return (
        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-md text-sm">
          <p className="font-semibold text-gray-700">{`Date: ${formattedDate}`}</p>
          <p className="text-indigo-600">{`Packages Received: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[400px] flex flex-col">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Daily Throughput
            {/* Display current month name if data is available */}
            {monthlyAggregatedTotals.length > 0 &&
              ` for ${getMonthDisplayName(
                monthlyAggregatedTotals[currentMonthIndex]?.month
              )}`}
          </h2>
        </div>

        {/* Month Pagination Controls */}
        {!loading && !error && monthlyAggregatedTotals.length > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              disabled={currentMonthIndex === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-600">
              {currentMonthIndex + 1} / {monthlyAggregatedTotals.length}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={
                currentMonthIndex === monthlyAggregatedTotals.length - 1
              }
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Next Month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* --- Loading, Error, and No Data States --- */}

      {loading && (
        <div className="flex flex-grow flex-col items-center justify-center text-indigo-700">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="mt-3 text-lg font-medium">Loading Chart Data...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-grow flex-col items-center justify-center text-red-700 p-4">
          <AlertTriangle className="h-10 w-10 mb-3 text-red-500" />
          <p className="text-lg font-semibold">Error Loading Chart</p>
          <p className="text-sm mt-1 text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Show "No Data Available" if dailyData is empty after loading */}
      {!loading && !error && dailyData.length === 0 && (
        <div className="flex flex-grow flex-col items-center justify-center text-blue-700 p-4">
          <TrendingUp className="h-10 w-10 mb-3 text-blue-500" />
          <p className="text-lg font-semibold">No Data Available</p>
          <p className="text-sm mt-1 text-blue-600 text-center">
            No throughput data found to display.
          </p>
        </div>
      )}

      {/* --- Chart Rendering --- */}
      {/* Render chart only if not loading, no error, AND there's data for the current month */}
      {!loading && !error && currentMonthDailyData.length > 0 && (
        <div className="h-72">
          {" "}
          {/* Fixed height for chart area */}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={currentMonthDailyData} // Use the filtered daily data for the current month
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="arrival_date" // Use original arrival_date from DailyPoint for X-axis
                stroke="#6b7280"
                // Format X-axis ticks to show just the day of the month
                tickFormatter={(dateStr) =>
                  new Date(dateStr).toLocaleDateString("en-US", {
                    day: "numeric",
                  })
                }
              />
              <YAxis
                stroke="#6b7280"
                label={{
                  value: "Packages",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#6b7280",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="packages_received" // Use packages_received from DailyPoint
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "#4f46e5",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#4f46e5",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
