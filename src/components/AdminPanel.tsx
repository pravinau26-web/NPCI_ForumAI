import React, { useState } from "react";
import { 
  Users, Shield, Server, Activity, Database, Check, AlertTriangle, 
  RefreshCw, Award, Terminal, Trash2, UserX, UserCheck, Key, Edit3, X, Save, Lock, UserPlus, Upload, FileText, Plus
} from "lucide-react";
import { User, UserRole } from "../types";
import { AdminConsole } from "./AdminConsole";

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onRefreshUsers?: () => void;
}

export default function AdminPanel({
  users,
  currentUser,
  onUpdateRole,
  onRefreshUsers,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"users" | "diagnostics">("users");

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("employee");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editIsSuspended, setEditIsSuspended] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Bulk User Addition Modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInputText, setBulkInputText] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // Reset password modal state
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Departments & Roles Management state
  interface DeptRoleItem {
    id: string;
    name: string;
    category: "Department" | "Role";
    description: string;
    activeCount: number;
  }
  const [deptRoles, setDeptRoles] = useState<DeptRoleItem[]>([
    { id: "dr-1", name: "Operations", category: "Department", description: "Payment processing, operational oversight, and settlement operations", activeCount: 5 },
    { id: "dr-2", name: "UPI Product", category: "Department", description: "UPI 2.0 specs, merchant onboarding, and dispute resolution features", activeCount: 3 },
    { id: "dr-3", name: "Compliance", category: "Department", description: "Regulatory compliance, policy audits, and risk assessment", activeCount: 4 },
    { id: "dr-4", name: "Risk & Settlement", category: "Department", description: "Fraud monitoring, velocity caps, and financial settlements", activeCount: 2 },
    { id: "dr-5", name: "Core Technology", category: "Department", description: "Infrastructure maintenance, micro-services, and platform architecture", activeCount: 6 },
    { id: "dr-6", name: "Platform Administrator", category: "Role", description: "Full system administrative control, user deletion, and security governance", activeCount: 2 },
    { id: "dr-7", name: "Compliance Admin", category: "Role", description: "Policy document uploads, specification management, and audit enforcement", activeCount: 3 },
    { id: "dr-8", name: "Team Lead / Owner", category: "Role", description: "Community channel creation, team supervision, and thread moderation", activeCount: 4 },
    { id: "dr-9", name: "Standard Employee", category: "Role", description: "General forum participant, discussion contributor, and chat user", activeCount: 12 }
  ]);
  const [showDeptRoleModal, setShowDeptRoleModal] = useState(false);
  const [editingDeptRole, setEditingDeptRole] = useState<DeptRoleItem | null>(null);
  const [deptRoleName, setDeptRoleName] = useState("");
  const [deptRoleCategory, setDeptRoleCategory] = useState<"Department" | "Role">("Department");
  const [deptRoleDescription, setDeptRoleDescription] = useState("");
  const [deptRoleError, setDeptRoleError] = useState("");
  const [isSubmittingDeptRole, setIsSubmittingDeptRole] = useState(false);

  React.useEffect(() => {
    fetch("/api/departments-roles")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDeptRoles(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenAddDeptRole = () => {
    setEditingDeptRole(null);
    setDeptRoleName("");
    setDeptRoleCategory("Department");
    setDeptRoleDescription("");
    setDeptRoleError("");
    setShowDeptRoleModal(true);
  };

  const handleOpenEditDeptRole = (item: DeptRoleItem) => {
    setEditingDeptRole(item);
    setDeptRoleName(item.name);
    setDeptRoleCategory(item.category);
    setDeptRoleDescription(item.description);
    setDeptRoleError("");
    setShowDeptRoleModal(true);
  };

  const handleSaveDeptRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptRoleName.trim()) return;

    setIsSubmittingDeptRole(true);
    setDeptRoleError("");

    try {
      if (editingDeptRole) {
        const res = await fetch(`/api/departments-roles/${editingDeptRole.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: deptRoleName,
            category: deptRoleCategory,
            description: deptRoleDescription
          })
        });
        if (res.ok) {
          const updated = await res.json();
          setDeptRoles(prev => prev.map(d => d.id === updated.id ? updated : d));
          setShowDeptRoleModal(false);
        } else {
          setDeptRoleError("Failed to update item.");
        }
      } else {
        const res = await fetch("/api/departments-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: deptRoleName,
            category: deptRoleCategory,
            description: deptRoleDescription
          })
        });
        if (res.ok) {
          const created = await res.json();
          setDeptRoles(prev => [...prev, created]);
          setShowDeptRoleModal(false);
        } else {
          setDeptRoleError("Failed to create item.");
        }
      }
    } catch (err) {
      setDeptRoleError("Error saving role/department.");
    } finally {
      setIsSubmittingDeptRole(false);
    }
  };

  const handleDeleteDeptRole = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Role / Department entry?")) return;
    try {
      const res = await fetch(`/api/departments-roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeptRoles(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      alert("Error deleting item.");
    }
  };

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

  // Authorization checks
  // User Delete Option: "NPI Form User" (platform_admin or username NPCI_Forum) and "Complaint Set Admin User" (policy_admin) ONLY
  const isNpiFormUser = currentUser.username === "NPCI_Forum" || currentUser.role === "platform_admin";
  const isComplaintSetAdmin = currentUser.role === "policy_admin";
  const canDeleteUsers = isNpiFormUser || isComplaintSetAdmin;

  // Suspend/Unsuspend Handler
  const handleToggleSuspend = async (user: User) => {
    const actionText = user.isSuspended ? "unsuspend" : "suspend";
    if (!confirm(`Are you sure you want to ${actionText} user @${user.username}?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}/suspend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSuspended: !user.isSuspended,
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        if (onRefreshUsers) onRefreshUsers();
      } else {
        const err = await res.json();
        alert(err.error || `Failed to ${actionText} user.`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error trying to ${actionText} user.`);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (user: User) => {
    if (!confirm(`CRITICAL WARNING: Are you sure you want to permanently delete user @${user.username} (${user.email})?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id
        }
      });

      if (res.ok) {
        alert(`User @${user.username} deleted successfully.`);
        if (onRefreshUsers) onRefreshUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete user.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error executing user deletion.");
    }
  };

  // Open Edit User Modal
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDepartment(user.department || "Operations");
    setEditPassword("");
    setEditIsSuspended(!!user.isSuspended);
    setEditError("");
    setEditSuccess("");
  };

  // Submit Edit User
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);
    setEditError("");
    setEditSuccess("");

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername.trim(),
          email: editEmail.trim(),
          role: editRole,
          department: editDepartment,
          password: editPassword.trim() || undefined,
          isSuspended: editIsSuspended,
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        setEditSuccess("User account updated successfully!");
        setTimeout(() => {
          setEditingUser(null);
          if (onRefreshUsers) onRefreshUsers();
        }, 1000);
      } else {
        const err = await res.json();
        setEditError(err.error || "Failed to update user details.");
      }
    } catch (err: any) {
      setEditError("Error saving user modifications.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Password Reset Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordValue.trim()) return;

    setResetError("");
    setResetSuccess("");

    try {
      const res = await fetch(`/api/users/${resetPasswordUser.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: newPasswordValue.trim(),
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        setResetSuccess(`Password for @${resetPasswordUser.username} reset successfully!`);
        setTimeout(() => {
          setResetPasswordUser(null);
          setNewPasswordValue("");
          if (onRefreshUsers) onRefreshUsers();
        }, 1200);
      } else {
        const err = await res.json();
        setResetError(err.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setResetError("Error executing password reset.");
    }
  };

  // Bulk User Addition Submission
  const handleBulkUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInputText.trim()) return;

    setIsSubmittingBulk(true);
    setBulkError("");
    setBulkSuccess("");

    try {
      // Parse CSV or line-by-line format: username, email, role, department
      const lines = bulkInputText.trim().split("\n");
      const parsedUsers = lines.map(line => {
        const parts = line.split(",").map(p => p.trim());
        return {
          username: parts[0] || "",
          email: parts[1] || "",
          role: (parts[2] || "employee") as UserRole,
          department: parts[3] || "Operations"
        };
      }).filter(u => u.username && u.email);

      if (parsedUsers.length === 0) {
        setBulkError("No valid rows found. Format: username, email, role, department (one per line).");
        setIsSubmittingBulk(false);
        return;
      }

      const res = await fetch("/api/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newUsers: parsedUsers,
          actorId: currentUser.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        let msg = `Successfully imported ${data.addedCount} new users!`;
        if (data.errors && data.errors.length > 0) {
          msg += ` (${data.errors.length} skipped due to duplicates or invalid domain).`;
        }
        setBulkSuccess(msg);
        setTimeout(() => {
          setShowBulkModal(false);
          setBulkInputText("");
          setBulkSuccess("");
          if (onRefreshUsers) onRefreshUsers();
        }, 1500);
      } else {
        const err = await res.json();
        setBulkError(err.error || "Failed to bulk import users.");
      }
    } catch (err: any) {
      setBulkError("Error executing bulk user import.");
    } finally {
      setIsSubmittingBulk(false);
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
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto h-[calc(100vh-4rem)] text-left space-y-6 transition-colors duration-200">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
            <span>Platform Administration Portal</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Manage employee permission configurations, user suspension, password resets, and cluster diagnostics.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "users"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>User Permissions & Security</span>
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "diagnostics"
                ? "bg-white dark:bg-slate-800 text-cyan-500 shadow"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cluster Terminal & Diagnostics</span>
          </button>
        </div>
      </div>

      {activeTab === "diagnostics" ? (
        <AdminConsole currentUser={currentUser} />
      ) : (
        <>
          {/* System Gateway Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-3.5">
                <div className="bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50">
                  <m.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.name}</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT TWO-THIRDS: Users List & Roles/Departments */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Employee Access Controls & User Administration</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowBulkModal(true);
                      setBulkError("");
                      setBulkSuccess("");
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow cursor-pointer flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Bulk Add Users</span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                    {users.filter(u => u.id !== 'npci_assistant').length} Registered Users
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 pr-2">Staff Member</th>
                      <th className="pb-3 px-2">Role & Dept</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((user) => {
                      const isAssistant = user.id === "npci_assistant";
                      if (isAssistant) return null; // NPCI Assistant role is locked

                      const isSelf = user.id === currentUser.id;

                      return (
                        <tr key={user.id} className="text-sm">
                          <td className="py-4 pr-2 flex items-center gap-2.5">
                            <div className="relative flex-shrink-0">
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${getStatusColor(
                                  user.status
                                )}`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{user.username}</p>
                                {user.isSuspended && (
                                  <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                                    SUSPENDED
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{user.email}</p>
                            </div>
                          </td>

                          <td className="py-4 px-2">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                              {getRoleLabel(user.role)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{user.department || "Operations"}</p>
                          </td>

                          <td className="py-4 px-2">
                            {isSelf ? (
                              <span className="text-[10px] text-slate-400 italic font-medium px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                                You
                              </span>
                            ) : (
                              <select
                                value={user.role}
                                onChange={(e) => onUpdateRole(user.id, e.target.value as UserRole)}
                                className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-800 rounded-lg p-1 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                              >
                                <option value="employee">Standard Employee</option>
                                <option value="lead">Team Lead / Owner</option>
                                <option value="policy_admin">Compliance Admin</option>
                                <option value="platform_admin">Platform Admin</option>
                              </select>
                            )}
                          </td>

                          <td className="py-4 pl-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit User Details */}
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition cursor-pointer"
                                title="Edit User"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setResetPasswordUser(user);
                                  setNewPasswordValue("");
                                  setResetError("");
                                  setResetSuccess("");
                                }}
                                className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition cursor-pointer"
                                title="Reset Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend / Unsuspend */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleSuspend(user)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    user.isSuspended
                                      ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                      : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                  }`}
                                  title={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                                >
                                  {user.isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Delete User (NPI Form User & Complaint Set Admin ONLY) */}
                              {!isSelf && canDeleteUsers && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition cursor-pointer"
                                  title="Delete User (Authorized Only)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECOND TABLE: Roles & Departments Management */}
            <div className="bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Roles & Departments Governance</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddDeptRole}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role / Department</span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                    {deptRoles.length} Active Configs
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2 px-2">Name</th>
                      <th className="py-2 px-2">Category</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 text-center">Active Count</th>
                      <th className="py-2 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-medium">
                    {deptRoles.map((dr) => (
                      <tr key={dr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-100">
                          {dr.name}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            dr.category === "Role" 
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800" 
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                          }`}>
                            {dr.category}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                          {dr.description || "N/A"}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                          {dr.activeCount} staff
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditDeptRole(dr)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDeptRole(dr.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

            {/* RIGHT ONE-THIRD: Admin Audits Warnings & Data Management */}
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-amber-200 dark:border-amber-800/60 pb-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-bounce" />
                  <span className="font-bold text-xs uppercase tracking-wider">Security & Permissions Policy</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Platform Admin and Complaint Set Admin users hold exclusive privileges to suspend, edit, or delete platform accounts.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                    <Check className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>NPI Form User / Platform Admin: Can suspend and delete users & communities.</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                    <Check className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Complaint Set Admin: Authorized to delete and manage users.</span>
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
        </>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit User Account</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-left">
              {editError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200">
                  ⚠️ {editError}
                </div>
              )}
              {editSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-200">
                  ✅ {editSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-semibold"
                  >
                    <option value="employee">Standard Employee</option>
                    <option value="lead">Team Lead / Owner</option>
                    <option value="policy_admin">Compliance Admin</option>
                    <option value="platform_admin">Platform Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">New Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-semibold"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-suspended"
                  checked={editIsSuspended}
                  onChange={(e) => setEditIsSuspended(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="chk-suspended" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Suspend User Account (Access Blocked)
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Reset User Password</span>
              </h3>
              <button onClick={() => setResetPasswordUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reset password for user <strong className="text-slate-800 dark:text-slate-200">@{resetPasswordUser.username}</strong> ({resetPasswordUser.email}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left">
              {resetError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200">
                  ⚠️ {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-200">
                  ✅ {resetSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password..."
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-semibold"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK USER ADDITION MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Bulk User Addition (CSV / Text Import)</span>
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Enter user records one per line using the comma-separated format:<br />
              <code className="text-blue-600 dark:text-indigo-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">username, email, role, department</code>
            </p>

            <div className="bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-700 dark:text-blue-300 font-mono space-y-1">
              <p className="font-bold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Example CSV Rows:</span>
              </p>
              <p>arun_k, arun@npci.org.in, employee, Operations</p>
              <p>meera_v, meera@npci.org.in, lead, UPI Product</p>
              <p>suresh_compliance, suresh@npci.org.in, policy_admin, Compliance</p>
            </div>

            <form onSubmit={handleBulkUserSubmit} className="space-y-4 text-left">
              {bulkError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200">
                  ⚠️ {bulkError}
                </div>
              )}
              {bulkSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-200">
                  ✅ {bulkSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">User Data Lines</label>
                <textarea
                  rows={6}
                  placeholder={`username1, email1@npci.org.in, employee, Operations\nusername2, email2@npci.org.in, lead, UPI Product`}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBulk}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Execute Import</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT DEPARTMENT & ROLE MODAL */}
      {showDeptRoleModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>{editingDeptRole ? "Edit Role / Department" : "Add Role / Department"}</span>
              </h3>
              <button onClick={() => setShowDeptRoleModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeptRole} className="space-y-4 text-left">
              {deptRoleError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200">
                  ⚠️ {deptRoleError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Category Type</label>
                <select
                  value={deptRoleCategory}
                  onChange={(e) => setDeptRoleCategory(e.target.value as "Department" | "Role")}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-medium"
                >
                  <option value="Department">Department</option>
                  <option value="Role">Role</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Title / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Risk Audit, Lead Specialist"
                  value={deptRoleName}
                  onChange={(e) => setDeptRoleName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Description</label>
                <textarea
                  rows={3}
                  placeholder="Responsibilities, scope, or operational mandate..."
                  value={deptRoleDescription}
                  onChange={(e) => setDeptRoleDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptRoleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDeptRole}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingDeptRole ? "Save Changes" : "Create Entry"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
