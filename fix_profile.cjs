const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSettingsModal.tsx', 'utf8');

const uploadHtml = `
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
`;

code = code.replace(
  /<input\s+type="text"\s+placeholder="Or paste custom image URL\.\.\."\s+value=\{avatar\}\s+onChange=\{\(e\) => setAvatar\(e\.target\.value\)\}\s+className="w-full [^"]+"\s+\/>/m,
  uploadHtml
);

fs.writeFileSync('src/components/ProfileSettingsModal.tsx', code);
console.log('ProfileSettingsModal fixed');
