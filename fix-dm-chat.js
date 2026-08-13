import fs from 'fs';
let content = fs.readFileSync('src/components/DMChat.tsx', 'utf-8');
const searchString = `                      {groupMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer" onClick={() => {
                          if (onViewProfile) onViewProfile(member);
                          setShowMembersList(false);
                        }}>
                          <div className="relative">
                            <img
                              src={member.avatar}
                              alt={member.username}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                            <span className={\`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-slate-900 \${getStatusColor(member.status)}\`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {member.username} {member.id === currentUser.id && <span className="text-[10px] text-slate-400 font-mono ml-1">(You)</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {member.department || "Operations"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>`;

const replaceString = searchString + `
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to exit this group?")) {
                            if (onExitGroup) onExitGroup(activeChat.id);
                            setShowMembersList(false);
                          }
                        }}
                        className="w-full text-center py-2 text-sm font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 rounded-xl transition cursor-pointer"
                      >
                        Exit Group
                      </button>
                      
                      {(activeChat.creatorId === currentUser.id || currentUser.role === "platform_admin") && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to permanently delete this group?")) {
                              if (onDeleteGroup) onDeleteGroup(activeChat.id);
                              setShowMembersList(false);
                            }
                          }}
                          className="w-full text-center py-2 text-sm font-bold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
                        >
                          Delete Group
                        </button>
                      )}
                    </div>`;
content = content.replace(searchString, replaceString);
fs.writeFileSync('src/components/DMChat.tsx', content);
