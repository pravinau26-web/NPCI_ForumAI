const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');

const departments = '["Operations", "Compliance", "UPI Product", "Risk & Settlement", "Audit & Fraud", "Core Technology", "Admin User"]';

const newInput = `
                    <select
                      required
                      value={departmentInput}
                      onChange={(e) => setDepartmentInput(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all"
                    >
                      <option value="" disabled>Select Dept</option>
                      {${departments}.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
`;

const regex = /<input\s+type="text"\s+required\s+placeholder="e\.g\. UPI APIs"\s+value=\{departmentInput\}\s+onChange=\{\(e\) => setDepartmentInput\(e\.target\.value\)\}\s+className="[^"]+"\s+\/>/m;

code = code.replace(regex, newInput.trim());
fs.writeFileSync('src/components/Login.tsx', code);
console.log('Login fixed');
