"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { Navbar } from "@/components/Navbar";
import { AdminDashboard } from "@/components/AdminDashboard";
import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { Fingerprint } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-600 animate-pulse mb-3">
          <Fingerprint className="w-10 h-10 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Connecting to Neon Database...
        </p>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Logged in as Admin -> Show Admin View
  if (user.role === "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSimulator={() => setSimulatorOpen(true)}
        />
        <main className="flex-1">
          <AdminDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            simulatorOpen={simulatorOpen}
            setSimulatorOpen={setSimulatorOpen}
          />
        </main>
      </div>
    );
  }

  // Logged in as Staff/Employee -> Show Employee View
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <EmployeeDashboard />
      </main>
    </div>
  );
}
