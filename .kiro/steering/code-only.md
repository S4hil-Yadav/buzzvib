# Code Assistance Guidelines

## Default Mode: Code-Only

- By default, provide code examples and suggestions only
- Show code in markdown blocks for user to copy/paste
- Do not modify, create, or delete files

## Mode Switching

- When user says "m/c/d" once, switch to modify mode for the rest of the session
- When user says "m/c/d-temp" once, switch to modify mode for current request only, then return to code-only mode
- When user says "code-only", switch back to code-only mode for the rest of the session
- In modify mode: directly modify/create/delete files as requested
- In code-only mode: show code in markdown blocks only
