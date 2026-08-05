import React, { useState } from "react";
import { X, Save, User as UserIcon, Mail, Building, FileText, ImageIcon, Sparkles } from "lucide-react";
import { User } from "../types";

interface ProfileSettingsModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateProfile: (updatedData: {
    username?: string;
    email?: string;
    avatar?: string;
    bio?: string;
    department?: string;
  }) => Promise<boolean>;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
];

const DEPARTMENTS = ["Operations", "Compliance", "UPI Product", "Risk & Settlement", "Audit & Fraud", "Core Technology", "Admin User"];

export default function ProfileSettingsModal({
  currentUser,
  onClose,
  onUpdateProfile,
}: ProfileSettingsModalProps) {
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [department, setDepartment] = useState(currentUser.department || "Operations");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg("Username cannot be empty");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Email cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const success = await onUpdateProfile({
        username: username.trim(),
        email: email.trim(),
        avatar,
        bio: bio.trim(),
        department,
      });

      if (success) {
        setSuccessMsg("Profile updated successfully!");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg("Failed to update profile. Username might be taken.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while updating profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 max-w-xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
              Profile Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-700 dark:text-slate-400 p-1.5 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-850 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl">
              ✅ {successMsg}
            </div>
          )}

          {/* AVATAR SELECTOR */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              <span>Workspace Photo</span>
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <img
                src={avatar}
                alt="Avatar Preview"
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-2.5 w-full">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                        avatar === url ? "border-blue-500 scale-105" : "border-transparent hover:scale-105"
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Or paste custom image URL..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3.5 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center justify-center transition shrink-0">
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setAvatar(ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>

              </div>
            </div>
          </div>

          {/* USERNAME & EMAIL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                <span>Username</span>
              </label>
              <input
                type="text"
                placeholder="Unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                placeholder="Your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>
          </div>

          {/* DEPARTMENT */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>Department / Unit</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
            >
              {DEPARTMENTS.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* BIO */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Biography Summary</span>
            </label>
            <textarea
              placeholder="Tell others what you do inside the NPCI workspace..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-600 font-medium leading-relaxed resize-none"
            />
          </div>

          {/* BUTTON ACTIONS */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
