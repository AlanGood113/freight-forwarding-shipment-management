"use client";

import { X, AlertTriangle } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface Props {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onConfirm: () => Promise<void>;
}

export default function ConfirmLogoutModal({
  isOpen,
  setIsOpen,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold">Confirm Logout</h3>
        </div>
        <p className="text-sm text-gray-700 mb-6">
          Are you sure you want to log out? This will delete the local database.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await onConfirm();
              setIsOpen(false);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
