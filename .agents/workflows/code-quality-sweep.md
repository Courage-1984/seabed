---
trigger: code-quality
description: Run the code quality tools (ESLint and Prettier) across the workspace, attempt to autofix, and report remaining issues.
---

# Code Quality Sweep

This workflow ensures the codebase adheres to the styling and linting configurations.

## Steps

1. **Format Check**: Run `npm run format`. This will use Prettier to automatically format all files in the project.
2. **Linting Check**: Run `npm run lint`. This will use ESLint to find issues in JavaScript files.
3. **Autofix**: If `npm run lint` fails with fixable errors, run `npm run lint -- --fix` to autofix them.
4. **Report**: Create an artifact or output summarizing the results. Specifically, mention:
   - If the formatter successfully ran over the codebase.
   - If ESLint found errors and how many were autofixed.
   - Any remaining manual ESLint violations that require user intervention.
5. Do not commit or push the autofixed changes automatically. Ask the user if they'd like to review the diff first.
