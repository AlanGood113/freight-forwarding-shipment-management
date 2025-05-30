"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, LayoutDashboard, Upload, LogOut } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Don’t render on /login
  if (path === "/login") return null;

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-extrabold text-indigo-700 flex items-center gap-2"
        >
          <LayoutDashboard className="h-7 w-7 text-indigo-600" />{" "}
          Freight Forwarding Shipment MS
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className={`flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition duration-200 ${
              path === "/" ? "font-semibold text-indigo-700" : ""
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/upload"
            className={`flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition duration-200 ${
              path === "/upload" ? "font-semibold text-indigo-700" : ""
            }`}
          >
            <Upload className="h-5 w-5" />
            Upload CSV
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center gap-2"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2"
            aria-label="Toggle navigation menu" // Accessibility
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4">
          <div className="flex flex-col items-center space-y-4">
            <Link
              href="/"
              className={`flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition duration-200 ${
                path === "/" ? "font-semibold text-indigo-700" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/upload"
              className={`flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition duration-200 ${
                path === "/upload" ? "font-semibold text-indigo-700" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Upload className="h-5 w-5" />
              Upload CSV
            </Link>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 w-3/4 flex items-center justify-center gap-2" // Center items in button for mobile
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
