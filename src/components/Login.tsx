import React, { useState, useEffect } from "react";
import { Shield, Sparkles, UserCheck, Mail, UserPlus, Key, ArrowRight, Check, Activity, Lock, AlertCircle, HelpCircle, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { User } from "../types";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export default function Login({ onLoginSuccess, theme, onToggleTheme }: LoginProps) {
  const [emailInput, setEmailInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"employee" | "lead" | "policy_admin">("employee");
  const [departmentInput, setDepartmentInput] = useState("Operations");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successPrompt, setSuccessPrompt] = useState("");

  const [reportsToInput, setReportsToInput] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setAvailableUsers(data.filter((u: any) => u.id !== "npci_assistant"));
        }
      } catch (err) {
        console.error("Failed to fetch supervisor users:", err);
      }
    };
    fetchAvailableUsers();
  }, []);

  // Forgot Password flow state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1 = input, 2 = simulated link, 3 = reset form
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Modal / overlay prompt state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const presetProfiles = [
    {
      name: "pravin",
      email: "pravinau26@gmail.com",
      role: "Team Lead / Developer",
      desc: "Pins topics, starts discussions, and tests standard forum upvoting.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "neha_compliance",
      email: "neha@npci.org.in",
      role: "Compliance & Policy Admin",
      desc: "Uploads policy docs, versions specs, and triggers AI change-diff reports.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "NPCI_Forum",
      email: "admin@npci.org.in",
      role: "Platform Administrator",
      desc: "Alters coworker access roles, audits system logs, and inspects health.",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "priya_s",
      email: "priya@npci.org.in",
      role: "Standard Employee (Away)",
      desc: "Tests the AI Auto-responder when coworkers message her.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    }
  ];

  const recentActivity = [
    {
      type: "discussion",
      title: "Clarification on UPI 2.0 ₹5 Lakh limit for healthcare",
      time: "1 hour ago",
      author: "pravin",
      details: "Discussing merchant category velocity limits."
    },
    {
      type: "compliance",
      title: "RuPay Card Security Protocol (v4.0)",
      time: "1 day ago",
      author: "neha_compliance",
      details: "EMV offline contactless payments tokenization updates."
    },
    {
      type: "discussion",
      title: "Biometric dual-factor Micro-ATM operational standards",
      time: "3 days ago",
      author: "rajesh_kumar",
      details: "Guidelines for Business Correspondent fingerprint verification."
    }
  ];

  const handlePresetSelect = (preset: typeof presetProfiles[0]) => {
    // Populate the form and show the prompt to log in manually as requested
    setEmailInput(preset.email);
    setPasswordInput("npciforum@01");
    setIsRegistering(false);
    setErrorMsg("");
    setSuccessPrompt("");

    setModalTitle("Authentication Required");
    setModalMessage(
      `To login as "${preset.name}" (${preset.role}), we've automatically pre-filled their credentials in the manual gateway below. \n\n🔒 Password: "npciforum@01" \n\nPlease click "Access Workspace" under the form to complete your sign-in!`
    );
    setShowPromptModal(true);
  };

  const handleActivitySelect = (activity: typeof recentActivity[0]) => {
    setModalTitle("Access Restricted");
    setModalMessage(
      `You clicked on: "${activity.title}". \n\nThis is a secure internal discussion posted in the National Payments Workspace. Please login or sign up using the manual gateway on the right to read full details!`
    );
    setShowPromptModal(true);
  };

  const handleRequestForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    setIsResetLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to request password reset.");
      }

      const data = await res.json();
      const tokenFromLink = data.resetLink.split("token=")[1];
      setResetToken(tokenFromLink);
      setForgotPasswordStep(2);
    } catch (err: any) {
      setForgotPasswordError(err.message || "An error occurred.");
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");

    if (resetNewPassword.length < 6) {
      setForgotPasswordError("Password must be at least 6 characters.");
      return;
    }

    setIsResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword: resetNewPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset password.");
      }

      setForgotPasswordSuccess("Password reset successfully! You can now log in.");
      setForgotPasswordStep(4);
    } catch (err: any) {
      setForgotPasswordError(err.message || "An error occurred.");
    } finally {
      setIsResetLoading(false);
    }
  };

  const validateForm = () => {
    if (!emailInput.trim()) {
      setErrorMsg("Email address is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setErrorMsg("Please enter a valid workspace email address.");
      return false;
    }

    if (!emailInput.trim().toLowerCase().endsWith("@npci.org.in")) {
      setErrorMsg("Unauthorized domain. Only @npci.org.in email addresses are authorized to create or login to this secure Payments Workspace.");
      return false;
    }

    if (!passwordInput) {
      setErrorMsg("Password is required.");
      return false;
    }

    if (isRegistering) {
      if (!usernameInput.trim()) {
        setErrorMsg("Username is required for registration.");
        return false;
      }
      if (usernameInput.trim().length < 3) {
        setErrorMsg("Username must be at least 3 characters long.");
        return false;
      }
      if (usernameInput.trim().includes(" ")) {
        setErrorMsg("Username cannot contain spaces.");
        return false;
      }
      if (passwordInput.length < 6) {
        setErrorMsg("Password must be at least 6 characters for safety.");
        return false;
      }
      if (availableUsers.length > 0 && !reportsToInput) {
        setErrorMsg("Hierarchy setup is mandatory. Please select who you report to.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMsg("");
    setSuccessPrompt("");
    try {
      let endpoint = "/api/auth/login";
      let body: any = { 
        email: emailInput.trim(), 
        password: passwordInput 
      };

      if (isRegistering) {
        endpoint = "/api/auth/register";
        body = {
          email: emailInput.trim(),
          username: usernameInput.trim().toLowerCase(),
          role: selectedRole,
          department: departmentInput,
          password: passwordInput,
          reportsTo: reportsToInput || undefined,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Authentication failed. Please verify your credentials.");
      }

      const data = await response.json();
      onLoginSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reach backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row h-full transition-colors duration-200 relative overflow-x-hidden">
      
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          type="button"
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-md cursor-pointer"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>
      )}
      
      {/* Left side: branding & recent things feed */}
      <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col justify-between p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 text-left overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/10 p-2.5 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-sm">
              <Shield className="w-8 h-8 text-blue-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>NPCI Forum</span>
                <span className="text-[10px] font-bold bg-blue-100 dark:bg-indigo-500/20 text-blue-800 dark:text-indigo-300 border border-blue-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-full uppercase font-mono">
                  Featurist
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">National Payments Workspace</p>
            </div>
          </div>

          <div className="space-y-3 max-w-lg">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              Secure compliance collaboration powered by grounded AI.
            </h2>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-300 leading-relaxed font-sans">
              Ask grounded policy questions (RAG), run automated version diff comparisons, pin topics, and discuss technical parameters under strict role-based gateways.
            </p>
          </div>

          {/* Recent Workspace Activity Feed (Recent Things) */}
          <div className="space-y-3.5 pt-4 max-w-lg">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Recent Workspace Activity Feed</span>
            </span>

            <div className="space-y-2.5">
              {recentActivity.map((act, idx) => (
                <div
                  key={idx}
                  onClick={() => handleActivitySelect(act)}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950/80 border border-slate-200 dark:border-slate-800 transition text-left cursor-pointer group"
                >
                  <div className="flex justify-between items-center gap-2 mb-1.5">
                    <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-full ${
                      act.type === "compliance" 
                        ? "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20" 
                        : "bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20"
                    }`}>
                      {act.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">{act.time}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition leading-snug">
                    {act.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">
                    {act.details} • Posted by @{act.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-indigo-400 animate-pulse" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono uppercase tracking-wider">
              NPCI AI ASSISTANT ONLINE • ACTIVE AUDITING ENABLED
            </p>
          </div>
        </div>
      </div>

      {/* Right side: interactive login & register forms */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-8 lg:p-12 flex flex-col justify-center min-h-[500px]">
        <div className="max-w-md mx-auto w-full space-y-8 text-left">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isRegistering ? "Create Workspace Account" : "Workspace Authentication"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isRegistering 
                ? "Sign up with custom details and select your technical operational role."
                : "Authenticate via verified NPCI credentials or select a preset test launcher."
              }
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successPrompt && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successPrompt}</span>
            </div>
          )}

          {/* Preset Profile Launchers */}
          {!isRegistering && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Instant Test Profile Launchers</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presetProfiles.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    disabled={isLoading}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition text-left cursor-pointer select-none"
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-bold uppercase">{p.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase font-mono">
              Or Manual Gateway
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                Workspace Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. pravinau26@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                    Username (lowercase, no spaces)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pravin_npci"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/\s+/g, "").toLowerCase())}
                    className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                      Technical Department
                    </label>
                    <select
                      required
                      value={departmentInput}
                      onChange={(e) => setDepartmentInput(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all"
                    >
                      <option value="" disabled>Select Dept</option>
                      {["Operations", "Compliance", "UPI Product", "Risk & Settlement", "Audit & Fraud", "Core Technology", "Admin User"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                      Designation Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all cursor-pointer font-sans"
                    >
                      <option value="employee">Standard Employee</option>
                      <option value="lead">Team Lead</option>
                      <option value="policy_admin">Compliance Admin</option>
                      {/* Platform Admin registration removed to prevent privilege escalation */}
                    </select>
                  </div>
                </div>

                {/* Reports To Hierarchy Dropdown */}
                {availableUsers.length > 0 && (
                  <div className="mt-3 text-left">
                    <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                      Reports To (Manager / Lead Selection) *
                    </label>
                    <select
                      required
                      value={reportsToInput}
                      onChange={(e) => setReportsToInput(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all cursor-pointer font-sans"
                    >
                      <option value="">-- Select Reporting Supervisor (Mandatory) --</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.role.replace("_", " ")}) - {u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                  Workspace Password
                </label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordEmail("");
                      setForgotPasswordError("");
                      setForgotPasswordSuccess("");
                      setForgotPasswordStep(1);
                      setShowForgotPasswordModal(true);
                    }}
                    className="text-[10px] text-blue-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={isRegistering ? "At least 6 characters" : "Preset password or npciforum@01"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-10 pr-10 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isRegistering ? "Register Custom Account" : "Access Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-200/50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg("");
                setSuccessPrompt("");
              }}
              className="text-xs text-blue-600 dark:text-indigo-400 hover:text-blue-500 dark:hover:text-indigo-300 font-bold cursor-pointer"
            >
              {isRegistering ? "Back to standard credential login" : "Need a custom administrative profile? Create one"}
            </button>
          </div>
        </div>
      </div>

      {/* Auth Prompt Modal Overlay */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-2.5 text-blue-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <HelpCircle className="w-5 h-5" />
              <h4 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white uppercase font-mono">{modalTitle}</h4>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
              {modalMessage}
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer font-mono"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal Overlay */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left relative">
            <div className="flex items-center gap-2.5 text-blue-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Key className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
              <h4 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white uppercase font-mono">Password Reset Center</h4>
            </div>

            {forgotPasswordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{forgotPasswordError}</span>
              </div>
            )}

            {forgotPasswordSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2">
                <Check className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{forgotPasswordSuccess}</span>
              </div>
            )}

            {/* STEP 1: Email Address Form */}
            {forgotPasswordStep === 1 && (
              <form onSubmit={handleRequestForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
                  Enter your workspace email address below. We'll generate a secure, simulated reset token link immediately.
                </p>
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Workspace Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. pravinau26@gmail.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-250 dark:border-slate-850 focus:outline-none focus:border-blue-500 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetLoading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>Request Token</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Simulated Reset Link Received */}
            {forgotPasswordStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
                  🔒 NPCI Mail Servers intercepted request and generated your secure password reset token link successfully!
                </p>
                
                <div className="bg-slate-100 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-250 dark:border-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-350 select-all break-all leading-relaxed">
                  <strong>Simulated Link:</strong><br />
                  http://npci.workspace/reset-password?token={resetToken}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep(3)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Execute Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-750 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Enter New Password */}
            {forgotPasswordStep === 3 && (
              <form onSubmit={handleExecuteResetPassword} className="space-y-4">
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
                  Enter your new password below. It will be verified against your last 3 passwords for compliance history.
                </p>
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    New Secure Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showResetPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 6 characters"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pl-10 pr-10 py-2.5 rounded-xl text-xs border border-slate-250 dark:border-slate-800 focus:outline-none focus:border-blue-500 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      title={showResetPassword ? "Hide password" : "Show password"}
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep(2)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isResetLoading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>Save Password</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success Message */}
            {forgotPasswordStep === 4 && (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
                  Your new compliance password has been saved, and the reset token invalidated successfully!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setPasswordInput(resetNewPassword);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition shadow cursor-pointer"
                >
                  Return to Manual Gateway
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
