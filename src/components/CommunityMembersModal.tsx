import React, { useState } from "react";
import { X, Users, Shield, Lock, Globe, Plus, Trash2, Search, Check, UserCheck, Building } from "lucide-react";
import { Community, User } from "../types";

interface CommunityMembersModalProps {
  community: Community;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onUpdateCommunityMembers: (
    communityId: string, 
    memberIds: string[], 
    allowedUserIds: string[], 
    allowedDepartments: string[]
  ) => Promise<void>;
  onViewProfile?: (user: User) => void;
}

const DEPARTMENTS = [
  "UPI Product",
  "Risk & Settlement",
  "Audit & Fraud",
  "Core Technology",
  "Admin User",
  "Operations",
  "Security & Governance",
  "Platform Engineering",
  "Bharat BillPay (BBPS)",
  "AePS Operations"
];

export default function CommunityMembersModal({
  community,
  users,
  currentUser,
  onClose,
  onUpdateCommunityMembers,
  onViewProfile,
}: CommunityMembersModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected allowed user IDs and departments
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>(
    community.allowedUserIds && community.allowedUserIds.length > 0
      ? community.allowedUserIds
      : community.memberIds || []
  );

  const [allowedDepartments, setAllowedDepartments] = useState<string[]>(
    community.allowedDepartments || []
  );

  const isCreatorOrAdmin = 
    currentUser.role === "platform_admin" || 
    currentUser.role === "policy_admin" || 
    currentUser.role === "lead" || 
    community.createdBy === currentUser.id;

  const creatorUser = users.find((u) => u.id === community.createdBy);

  // Determine effective members list
  const memberSet = new Set<string>();
  (community.memberIds || []).forEach((id) => memberSet.add(id));
  (community.allowedUserIds || []).forEach((id) => memberSet.add(id));

  // Also users matching allowed departments if restricted
  if (community.allowedDepartments && community.allowedDepartments.length > 0) {
    users.forEach((u) => {
      if (u.department && community.allowedDepartments?.includes(u.department)) {
        memberSet.add(u.id);
      }
    });
  }

  // Active members objects
  const activeMembers = users.filter((u) => memberSet.has(u.id) || !community.isPrivate);

  // Filtered members for search inside current list
  const filteredActiveMembers = activeMembers.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const toggleUserSelection = (userId: string) => {
    setAllowedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleDeptSelection = (dept: string) => {
    setAllowedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Calculate full member IDs
      const newMemberSet = new Set<string>();
      newMemberSet.add(community.createdBy);
      newMemberSet.add("npci_assistant");
      allowedUserIds.forEach((id) => newMemberSet.add(id));
      
      users.forEach((u) => {
        if (u.department && allowedDepartments.includes(u.department)) {
          newMemberSet.add(u.id);
        }
      });

      const finalMemberIds = Array.from(newMemberSet);

      await onUpdateCommunityMembers(
        community.id,
        finalMemberIds,
        allowedUserIds,
        allowedDepartments
      );
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update community access permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-extrabold text-lg">
              #{community.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">#{community.name}</h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    community.isPrivate
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {community.isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                  <span>{community.isPrivate ? "Restricted Secure Community" : "Public Workspace Channel"}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                {community.description || "Active community discussion group"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Overview Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {creatorUser && (
                <img
                  src={creatorUser.avatar}
                  alt={creatorUser.username}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Community Owner & Creator</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>{creatorUser ? creatorUser.username : "NPCI Staff"}</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded font-mono">
                    🛡️ Verified Secure
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <p className="text-slate-400">Total Authorized Members</p>
                <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {community.isPrivate ? activeMembers.length : users.length} Staff
                </p>
              </div>

              {isCreatorOrAdmin && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manage Access & Add Members</span>
                </button>
              )}
            </div>
          </div>

          {/* EDIT ACCESS MODE */}
          {isEditing ? (
            <div className="space-y-5 bg-blue-50/40 dark:bg-slate-800/80 p-5 rounded-2xl border border-blue-200/70 dark:border-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-blue-200/50 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Configure Access Control & Authorized Coworkers</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select specific staff members or departments who are permitted to join #{community.name}.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Department Checkboxes */}
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  <span>Allowed Departments</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEPARTMENTS.map((dept) => {
                    const isChecked = allowedDepartments.includes(dept);
                    return (
                      <label
                        key={dept}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-blue-100/80 border-blue-400 text-blue-900 font-bold dark:bg-blue-950/80 dark:border-blue-600 dark:text-blue-200"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDeptSelection(dept)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{dept}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Individual Users Checklist */}
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Allowed Individual Coworkers & Security Badges</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  {users.map((u) => {
                    const isChecked = allowedUserIds.includes(u.id) || u.id === community.createdBy || u.id === "npci_assistant";
                    const isOwner = u.id === community.createdBy;
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs transition ${
                          isChecked
                            ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                            : "border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isOwner}
                            onChange={() => toggleUserSelection(u.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <img
                            src={u.avatar}
                            alt={u.username}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="truncate text-left min-w-0">
                            <p className="font-bold truncate">{u.username} {isOwner && "(Owner)"}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.department || u.email}</p>
                          </div>
                        </div>

                        <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded font-mono shrink-0 ml-1 border border-emerald-300 dark:border-emerald-800">
                          🛡️ Verified Secure
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-blue-200/60 dark:border-slate-700">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Saving Permissions...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Access Configuration</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MEMBERS LIST MODE */
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search authorized community members by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold shrink-0">
                  {filteredActiveMembers.length} Members
                </span>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredActiveMembers.map((member) => {
                  const isOwner = member.id === community.createdBy;
                  return (
                    <div
                      key={member.id}
                      onClick={() => onViewProfile && onViewProfile(member)}
                      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500/60 transition cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.username}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 bg-emerald-500" />
                        </div>
                        <div className="truncate text-left min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors flex items-center gap-1">
                            <span>{member.username}</span>
                            {isOwner && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1 rounded font-mono font-bold">
                                OWNER
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {member.department || "Operations"} • {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded font-mono border border-emerald-200 dark:border-emerald-800">
                          🛡️ Verified Secure
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>NPCI Forum Community Access Protocol</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
