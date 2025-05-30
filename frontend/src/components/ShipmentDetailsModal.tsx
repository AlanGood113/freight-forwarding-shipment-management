"use client";

import { X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface ShipmentDetail {
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
  departure_date?: string | null;
  delivered_date?: string | null;
}

interface Props {
  shipment?: ShipmentDetail;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export default function ShipmentDetailsModal({
  shipment,
  isOpen,
  setIsOpen,
}: Props) {
  if (!isOpen || !shipment) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Shipment Details</h2>
        <div className="space-y-2 text-sm">
          {Object.entries(shipment)
            .filter(([key]) => key !== "rn")
            .map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span>{value ?? "—"}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
