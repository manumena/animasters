# Code readability

- Write code for a human maintainer: descriptive names, clear control flow, and one logical operation per line.
- Group related declarations and steps with blank lines and short section comments where they help navigation.
- Split long functions into named operations when each operation has a distinct responsibility.
- Explain non-obvious decisions, data contracts, lifecycle behavior, and invariants in comments. Avoid comments that merely repeat the code.
- Apply this style to new code, tests, and code substantially changed during a task. Do not reformat unrelated files just for consistency.
