// src/app/upload/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [msg, setMsg] = useState<string>("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setStatus("idle");
    setMsg("");
  };

  const upload = async () => {
    if (!file) return;
    setStatus("uploading");
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/`, {
        method: "POST",
        body: form,
      });
      const payload = await res.json();

      if (res.ok) {
        setStatus("success");
        setMsg(payload.message);
        setTimeout(() => router.push("/"), 1000);
      } else {
        setStatus("error");
        setMsg(payload.detail || payload.message);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setStatus("error");
      setMsg(err.message || "Unknown error");
    }
  };

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">Upload Shipments CSV</h1>
      <input type="file" accept=".csv" onChange={onChange} className="block" />
      <button
        onClick={upload}
        disabled={!file || status === "uploading"}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {status === "uploading" ? "Uploading…" : "Upload"}
      </button>

      {status === "success" && (
        <p className="text-green-600">Success! {msg}. Redirecting…</p>
      )}
      {status === "error" && <p className="text-red-600">Error: {msg}</p>}
    </div>
  );
}
