"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react"; // Import Eye and EyeOff icons

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

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
    <div className="flex items-center justify-center min-h-screen bg-blue-50 text-gray-900">
      {/* Login Card Container */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl border border-blue-100">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-700">
            Welcome Back!
          </h1>
          <p className="mt-2 text-md text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 transition duration-150 ease-in-out"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="your.username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                // Dynamically set type based on showPassword state
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 transition duration-150 ease-in-out"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
              />
              {/* Show/Hide password toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-100 p-3 rounded-md text-center border border-red-200">
              {error}
            </p>
          )}

          <div className="pt-3">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              LOG IN
            </button>
          </div>
        </form>
        <p className="mt-8 text-xs text-center text-gray-500">
          &copy; {new Date().getFullYear()} Alan R. Gooding. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
