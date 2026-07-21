---
name: qa-sweep-all
description: Runs a comprehensive repo-wide QA sweep across all sites and summarizes the results from the report.
---

# QA Sweep All

## Goal

Run the QA sweep script across every site in the repository to identify systemic issues or broken sites, without needing to visually inspect every single screenshot.

## Preconditions

- The repository must be built (e.g., `npm run build`).

## Procedure

1. **Run Sweep:** Execute `node qa_sweep.js` from the repository root without any arguments. This runs Puppeteer across all `sites/*/index.html` (and other pages).
2. **Analyze Report:** The script will output to `qa-report.json`. If the script exits with an error code, it means there are failures. 
3. **Summarize Failures:** Use the `run_command` tool with PowerShell or Node.js to filter and identify the specific sites and pages that failed (e.g., due to overflow, broken images, or non-WebP assets).
4. **Report to User:** Summarize the failures clearly so the user knows which sites need attention. Do not attempt to load all screenshots as it will consume too much context.

## Next

Present the summary report to the user and suggest next steps for fixing the broken sites.
