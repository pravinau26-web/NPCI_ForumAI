import React, { useState, useEffect } from "react";
import { Users, Layers, Award, ShieldAlert, Code, Terminal, Bot, Search, Info, Mail } from "lucide-react";
import { User } from "../types";

interface HierarchyViewProps {
  users: User[];
  currentUser: User;
}

export default function HierarchyView({ users, currentUser }: HierarchyViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<User | null>(null);
  const [selectedManager, setSelectedManager] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setSelectedManager(selectedNode?.reportsTo || "");
  }, [selectedNode]);

  const handleUpdateHierarchy = async () => {
    if (!selectedNode) return;
    setIsUpdating(true);
    try {
      await fetch(`/api/users/${selectedNode.id}/reports-to`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportsTo: selectedManager }),
      });
      // Locally update as well
      selectedNode.reportsTo = selectedManager;
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Define structured reporting line
  const hierarchyData = [
    {
      role: "platform_admin",
      title: "Chief Technical Platform Architect",
      desc: "Architects NPCI cloud-native platform infrastructure, Kubernetes operations, and system administration.",
      color: "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20",
      icon: Terminal,
    },
    {
      role: "policy_admin",
      title: "Risk & Policy Compliance Director",
      desc: "Drafts UPI 2.0 regulatory compliance guidelines, EMV card tokens protocol, and oversees audit logs.",
      color: "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
      icon: ShieldAlert,
    },
    {
      role: "lead",
      title: "Lead Architect & Team Developer",
      desc: "Manages active repository branches, pins priority topics, and resolves core API anomalies.",
      color: "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20",
      icon: Code,
    },
    {
      role: "employee",
      title: "Technical Engineering Staff",
      desc: "Develops client features, optimizes micro-payment velocity, and manages daily service queues.",
      color: "border-slate-300 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20",
      icon: Users,
    }
  ];

  // Map users into the hierarchy
  const categorizedUsers = hierarchyData.map(roleGroup => {
    const groupUsers = users.filter(u => u.role === roleGroup.role && u.id !== "npci_assistant");
    return {
      ...roleGroup,
      members: groupUsers
    };
  });

  const filteredGroups = categorizedUsers.map(group => {
    const filteredMembers = group.members.filter(m => 
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return {
      ...group,
      members: filteredMembers
    };
  }).filter(group => group.members.length > 0);

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto h-full text-left transition-colors duration-200">
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-6 gap-4">
        <div>
          <h1 className="font-extrabold text-slate-900 dark:text-white text-xl flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
            <span>NPCI Technical Hierarchy & Architecture</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">
            Interactive structural reporting line for payment architects, compliance admins, and system engineers.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT TWO-THIRDS: Hierarchy Visual Layout */}
        <div className="lg:col-span-2 space-y-8 relative">
          
          {/* Vertical Linking Line */}
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 hidden md:block" />

          {filteredGroups.map((group, gIdx) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.role} className="relative space-y-3 pl-0 md:pl-16 animate-in slide-in-from-left duration-250" style={{ animationDelay: `${gIdx * 75}ms` }}>
                
                {/* Visual Circle Indicator */}
                <div className="absolute left-5 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 bg-blue-500 dark:bg-indigo-500 shadow-md hidden md:block -translate-x-1/2 flex items-center justify-center">
                  <span className="text-[10px] text-white font-extrabold">{gIdx + 1}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 border-b border-slate-200/60 dark:border-slate-800/40 pb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <GroupIcon className="w-4 h-4 text-blue-500 dark:text-indigo-400" />
                      <span>{group.title}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{group.desc}</p>
                  </div>
                  <span className="text-[9px] font-bold font-mono bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase self-start md:self-auto">
                    {group.members.length} active
                  </span>
                </div>

                {/* Team Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedNode(member)}
                      className={`p-4 rounded-2xl border transition-all text-left cursor-pointer flex gap-3 items-start select-none relative ${
                        selectedNode?.id === member.id
                          ? "bg-blue-50/50 dark:bg-indigo-950/10 border-blue-400 dark:border-indigo-500 shadow-md"
                          : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <img
                        src={member.avatar}
                        alt={member.username}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1 truncate flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-500 truncate">
                            @{member.username}
                          </h4>
                          <span className={`w-2 h-2 rounded-full ${
                            member.status === "online" 
                              ? "bg-emerald-500 animate-pulse" 
                              : member.status === "away" 
                                ? "bg-amber-500" 
                                : "bg-slate-400"
                          }`} />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono truncate">
                          {member.department || "General Operations"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans truncate">
                          {member.bio || "No biography provided."}
                        </p>
                      </div>

                      {/* Current User tag */}
                      {member.id === currentUser.id && (
                        <span className="absolute bottom-2 right-2 text-[8px] bg-blue-100 dark:bg-indigo-500/20 text-blue-700 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded border border-blue-200 dark:border-indigo-500/30">
                          YOU
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT ONE-THIRD: Node Inspector Details */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500 dark:text-indigo-400" />
            <span>Technical Node Inspector</span>
          </h3>

          {selectedNode ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <img
                    src={selectedNode.avatar}
                    alt={selectedNode.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    selectedNode.status === "online" 
                      ? "bg-emerald-500" 
                      : selectedNode.status === "away" 
                        ? "bg-amber-500" 
                        : "bg-slate-400"
                  }`} />
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    @{selectedNode.username}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
                    {selectedNode.department || "Operations"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-1">
                    System Role Designation
                  </span>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-bold capitalize font-sans">
                    {selectedNode.role.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Biography Context
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-950 font-medium">
                    {selectedNode.bio || "No professional overview or portfolio details listed."}
                  </p>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Direct Messaging Key
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] bg-slate-50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-950">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{selectedNode.email}</span>
                  </div>
                </div>

                {/* Reports To Section */}
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Reports To (Reporting Manager)
                  </span>
                  <div className="text-slate-700 dark:text-slate-300 font-medium text-xs bg-slate-50 dark:bg-slate-950/20 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-950">
                    {selectedNode.reportsTo ? (
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span>{users.find(u => u.id === selectedNode.reportsTo)?.username || "Unknown Manager"}</span>
                        <span className="text-[10px] text-slate-400">({users.find(u => u.id === selectedNode.reportsTo)?.email})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None (Root Level System Administrator)</span>
                    )}
                  </div>
                </div>

                {/* Platform Admin hierarchy editor */}
                {currentUser.role === "platform_admin" && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2.5">
                    <span className="block text-[10px] font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-wider font-mono">
                      🛡️ Hierarchy Administrative Action
                    </span>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">Change Reporting Line</label>
                      <select
                        value={selectedManager}
                        onChange={(e) => setSelectedManager(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-150 p-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none"
                      >
                        <option value="">None (Initial Administrator / Setup Root)</option>
                        {users
                          .filter(u => u.id !== selectedNode.id && u.id !== "npci_assistant")
                          .map(u => (
                            <option key={u.id} value={u.id}>
                              {u.username} ({u.role.replace("_", " ")}) - {u.email}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    <button
                      onClick={handleUpdateHierarchy}
                      disabled={isUpdating}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>{isUpdating ? "Saving Structure..." : "Update Reporting Structure"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
              <Award className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">
                No Node Selected
              </p>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 leading-relaxed font-sans">
                Click any payment architect or engineer card in the reporting structure tree to inspect their full profile, technical role, and credentials.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
