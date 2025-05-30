"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Basic validation (optional, but good practice)
    if (!user || !pass) {
      setError("Username and password are required.");
      return;
    }
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (res.ok) {
        router.push("/");
      } else {
        const json = await res.json();
        setError(json.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-navy-400">Welcome Back!</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your account
          </p>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-navy-300"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm text-slate-200"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="your.username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm text-slate-200"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/30 p-3 rounded-md text-center">
              {error}
            </p>
          )}

          <div className="pt-3">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              LOG IN
            </button>
          </div>
        </form>
        <p className="mt-8 text-xs text-center text-slate-500">
          &copy; {new Date().getFullYear()} Alan R. Gooding. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
