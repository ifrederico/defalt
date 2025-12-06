# AGENTS.md

AI assistant behavior guidelines for this repository.

## Communication Style

- Be blunt and minimal. No narrative about your process or shifting approach.
- Prioritize correctness over speed. Slow and accurate > fast and wrong.
- In all interactions and commit messages, be extremely concise. Sacrifice grammar for brevity.

## Task Approach

- Before coding, restate task in 2–4 bullets; ask questions instead of guessing.
- After plans or code, include a short checklist of requirements and mark what is done.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## GitHub

- Primary method for interacting with GitHub should be the GitHub CLI.
- When tagging Claude in GitHub issues, use '@claude'

## Git

- When creating branches, prefix them with `frederico/` to indicate they came from me.

## PR Comments

When I say to add a comment to a PR with a TODO on it, use the GitHub checkbox markdown format:

```markdown
- [ ] A description of the todo goes here
```

## Runtime Verification

- Never declare UI/behavior fixes as "fixed" without verification.
- For changes that affect runtime behavior (React components, styling, state):
  - Describe what was changed and why it *should* fix the issue.
  - Ask user to verify in the running app.
  - Wait for confirmation before marking complete.
- TypeScript compilation passing ≠ behavior working.
- Only claim "fixed" after user confirms the actual behavior.

## Debugging

- Trace actual data flow step-by-step before adding fixes.
- Don't add safety nets around symptoms - find the root cause first.
- For loops/callbacks: trace what each variable holds at each step.
- Ask: "What does X equal when Y happens?" not "How can I prevent Y?"
