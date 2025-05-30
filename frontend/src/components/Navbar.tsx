"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const path = usePathname();

  // Don’t render on /login
  if (path === "/login") return null;

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between bg-gray-100 p-4">
      <Link href="/" className="text-xl font-bold">
        Freight Forwarding
      </Link>
      <div className="space-x-4">
        <Link href="/" className="hover:underline">
          Dashboard
        </Link>
        <Link href="/upload" className="hover:underline">
          Upload CSV
        </Link>
        <button
          onClick={logout}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}
