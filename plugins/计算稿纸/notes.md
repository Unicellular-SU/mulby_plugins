# Notes: 计算稿纸功能增强

## Sources

### Source 1: codebase inspection
- URL: local files
- Key points:
  - UI is simple input/output textarea in `src/ui/App.tsx`.
  - No calculator logic exists; styles are basic dark theme in `src/ui/styles.css`.
  - Clipboard API available via `useMulby` hook.

## Synthesized Findings

### Existing structure
- Single-page React UI with basic titlebar and container.
- No multi-line state management; needs new layout for line entries and results.
