import React from "react";
import { 
  Users, Shield, Server, Activity, Database, Check, AlertTriangle, 
  RefreshCw, Award, Circle 
} from "lucide-react";
import { User, UserRole } from "../types";

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onUpdateRole: (userId: string, role: UserRole) => void;
}

export default function AdminPanel({
  users,
  currentUser,
  onUpdateRole,
}: AdminPanelProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "away":
        return "bg-amber-500";
      case "offline":
      default:
        return "bg-slate-400";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "platform_admin":
        return "Platform Administrator";
      case "policy_admin":
        return "Compliance & Policy Admin";
      case "lead":
        return "Team Lead / Owner";
      case "employee":
      default:
        return "Standard Employee";
    }
  };

  // Simulated platform health statistics
  const metrics = [
    { name: "MCP Gateway Status", value: "Healthy", status: "ok", icon: Server },
    { name: "Postgres Connection Pool", value: "Active (24/30)", status: "ok", icon: Database },
    { name: "Live WS Subscriptions", value: `${users.filter(u => u.status !== 'offline').length} active nodes`, status: "ok", icon: Activity },
    { name: "AI Vector Index", value: "UPI/RuPay Grounded (128 Chunks)", status: "ok", icon: Award }
  ];

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto h-[calc(100vh-4rem)] text-left space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="font-bold text-slate-900 text-xl flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Platform Administration Portal</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Manage employee permission configurations, assign administrative tokens, and monitor workspace gateways.
        </p>
      </div>

      {/* System Gateway Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-3.5">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 border border-blue-100/50">
              <m.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.name}</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT TWO-THIRDS: Users List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Employee Access Controls</span>
          </h3>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Staff Member</th>
                  <th className="pb-3 px-4">Workspace Role</th>
                  <th className="pb-3 pl-4 text-right">Access Token Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isAssistant = user.id === "npci_assistant";
                  if (isAssistant) return null; // NPCI Assistant role is locked

                  return (
                    <tr key={user.id} className="text-sm">
                      <td className="py-4 pr-4 flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(
                              user.status
                            )}`}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{user.username}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</p>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-slate-500 font-mono">
                        {getRoleLabel(user.role)}
                      </td>

                      <td className="py-4 pl-4 text-right">
                        {user.id === currentUser.id ? (
                          <span className="text-[10px] text-slate-400 italic font-medium px-2 py-1 bg-slate-50 border rounded-lg">
                            Active Admin Session
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => onUpdateRole(user.id, e.target.value as UserRole)}
                            className="bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                          >
                            <option value="employee">Standard Employee</option>
                            <option value="lead">Team Lead / Owner</option>
                            <option value="policy_admin">Compliance Admin</option>
                            <option value="platform_admin">Platform Admin</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT ONE-THIRD: Admin Audits Warnings & Data Management */}
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-amber-200 dark:border-amber-800/60 pb-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-bounce" />
              <span className="font-bold text-xs uppercase tracking-wider">Security Advisory</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Changing user permissions modifies their access to the Compliance portal, private forums, and administrative tools instantly.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                <Check className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Platform Admin: Full user and logs oversight.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                <Check className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Compliance Admin: Can publish guidelines & run diffs.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                <Check className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Team Lead: Can pin threads and moderate.</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100 font-mono">
              Fresh Workspace Initialization
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Wipe pre-populated sample discussions and policies to start entering fresh manual workspace data.
            </p>
            <button
              onClick={async () => {
                if (confirm("Are you sure you want to clear all sample dummy discussions and compliance policies to start with fresh manual user data?")) {
                  try {
                    const res = await fetch("/api/admin/clear-data", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ actorId: currentUser.id })
                    });
                    if (res.ok) {
                      alert("Sample data cleared! Refreshing workspace...");
                      window.location.reload();
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }
              }}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Sample Dummy Data (Start Fresh)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

