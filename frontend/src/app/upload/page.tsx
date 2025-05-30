"use client";

import { useState, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

// Define the structure for the API response payload
interface ApiResponse {
  message: string;
  detail?: string; // Optional detail field for errors
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [msg, setMsg] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (
        selectedFile.type === "text/csv" ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);
        setStatus("idle");
        setMsg("");
      } else {
        setFile(null);
        setStatus("error");
        setMsg("Invalid file type. Please upload a CSV file.");
        setIsModalOpen(true); // Show error in modal
      }
    } else {
      setFile(null);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0] ?? null);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if not dragging over a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation();
    setIsDragging(true); // Keep highlighting when dragging over
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const upload = async () => {
    if (!file) return;
    setStatus("uploading");
    setIsModalOpen(false); // Close any previous modal
    setMsg("");

    const form = new FormData();
    form.append("file", file);

    try {
      // Ensure NEXT_PUBLIC_API_URL is defined in your .env.local
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error(
          "API URL is not configured. Please set NEXT_PUBLIC_API_URL."
        );
      }

      const res = await fetch(`${apiUrl}/upload/`, {
        method: "POST",
        body: form,
        // Add any necessary headers, e.g., for authentication if required
        // headers: { 'Authorization': `Bearer ${token}` }
      });

      const payload: ApiResponse = await res.json();

      if (res.ok) {
        setStatus("success");
        setMsg(payload.message || "File uploaded successfully!");
      } else {
        setStatus("error");
        setMsg(
          payload.detail ||
            payload.message ||
            `Upload failed with status: ${res.status}`
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setStatus("error");
      // Check if err.message is available, otherwise provide a generic error
      setMsg(err.message || "An unexpected error occurred during upload.");
      console.error("Upload error:", err);
    }
    setIsModalOpen(true); // Open modal with the result
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Optionally reset status if user closes error modal without navigating
    if (status === "error") {
      // setStatus("idle"); // Or keep error state until new file is chosen
    }
  };

  const handleModalNext = () => {
    closeModal();
    if (status === "success") {
      router.push("/");
    }
  };

  const getIconForFile = () => {
    if (file) {
      return <FileText className="w-12 h-12 text-blue-500" />;
    }
    return (
      <UploadCloud
        className={`w-12 h-12 ${
          isDragging ? "text-blue-600" : "text-gray-400"
        }`}
      />
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4 font-sans">
      <div className="w-full max-w-lg p-6 sm:p-8 bg-white rounded-xl shadow-2xl space-y-6 border border-blue-100">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Upload Shipments CSV
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop or click to select a single CSV file.
          </p>
        </div>

        {/* File Dropzone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-48 sm:h-64 p-5 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }
            ${file ? "border-blue-500 bg-blue-50" : ""}`}
        >
          <input
            type="file"
            id="file-upload"
            accept=".csv,text/csv"
            onChange={onFileInputChange}
            className="sr-only" // Visually hidden, but accessible
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          >
            {getIconForFile()}
            <p
              className={`mt-2 text-sm sm:text-base font-medium ${
                isDragging ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {file
                ? file.name
                : isDragging
                ? "Drop the file here"
                : "Drag & drop or click to upload"}
            </p>
            {!file && (
              <p className="mt-1 text-xs text-gray-400">
                CSV files only, max 1 file.
              </p>
            )}
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent label click
                  setFile(null);
                  setStatus("idle");
                  setMsg("");
                  // Reset the actual file input value if needed
                  const fileInput = document.getElementById(
                    "file-upload"
                  ) as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold"
              >
                Remove file
              </button>
            )}
          </label>
        </div>

        {/* Upload Button */}
        <button
          onClick={upload}
          disabled={!file || status === "uploading"}
          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Uploading...
            </>
          ) : (
            "Upload File"
          )}
        </button>
      </div>

      {/* Status Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={closeModal} // Close modal on backdrop click
        >
          <div
            className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalEnter"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="flex flex-col items-center text-center">
              {status === "success" && (
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              )}
              {status === "error" && (
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
              )}
              {status === "uploading" && (
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
              )}

              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
                {status === "success" && "Upload Successful!"}
                {status === "error" && "Upload Failed"}
                {status === "uploading" && "Processing..."}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {msg ||
                  (status === "uploading"
                    ? "Please wait while we process your file."
                    : "Something went wrong.")}
              </p>

              <div className="w-full">
                {status === "success" && (
                  <button
                    onClick={handleModalNext}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    Next
                  </button>
                )}
                {status === "error" && (
                  <button
                    onClick={closeModal}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    Close
                  </button>
                )}
                {/* No button for uploading state in modal, or a cancel button could be added */}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Simple footer */}
      <footer className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Alan R. Gooding. All rights
          reserved.
        </p>
      </footer>
      {/* Add a style tag for the animation if not using a global CSS file */}
      <style jsx global>{`
        @keyframes modalEnterAnimation {
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-modalEnter {
          animation: modalEnterAnimation 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
