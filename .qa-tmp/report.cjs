// Print every non-empty issue bucket from the last qa-report.json.
const r = require('../qa-report.json');
const out = [];
for (const p of r.pages || []) {
  for (const vp of ['mobile', 'desktop']) {
    const v = p[vp];
    if (!v) continue;
    for (const [k, val] of Object.entries(v)) {
      if (Array.isArray(val) && val.length) {
        out.push(`${p.path.split('/').pop()} @${vp} ${k}: ${JSON.stringify(val).slice(0, 220)}`);
      } else if (k === 'visualIssues') {
        for (const [k2, v2] of Object.entries(val)) {
          if (Array.isArray(v2) && v2.length) {
            out.push(`${p.path.split('/').pop()} @${vp} ${k2}: ${JSON.stringify(v2).slice(0, 220)}`);
          }
        }
      }
    }
  }
}
console.log(r.summary.pass ? 'PASS' : 'FAIL');
console.log([...new Set(out)].join('\n'));
