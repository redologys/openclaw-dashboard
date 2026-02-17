# Phase 10: Intelligence & Analytics Layer - Detailed Specifications

## 1. Agent Brain Editor

**Location:** `/agents` page (as a new tab in the agent detail panel)

- **SYSTEM PROMPT EDITOR:**
  - Monaco code editor (syntax highlighted, line numbers).
  - Template variable support: `{{USER_NAME}}`, `{{DATE}}`, `{{FACT_CATEGORY}}`, etc.
  - Variable inspector: shows all detected `{{variables}}` + default values.
  - Character/token counter with model context limit indicator.
  - "Test Prompt" button: sends a test message with current prompt.
  - Version history: last 10 versions with timestamps + diff view.
  - Restore functionality.
- **MODEL CONFIGURATION:**
  - Provider dropdown: Anthropic / OpenRouter / Gemini / Ollama.
  - Model ID input with autocomplete.
  - Temperature slider (0.0 - 1.0).
  - Max tokens & Top-P inputs.
  - Estimated cost calculation display ($/1k tokens).
- **SKILL MATRIX:**
  - Grid of all available skills as toggle cards.
  - Drag to reorder skill priority.
  - Risk badges (color-coded) for shell/file/web skills.
  - "Test Skill" button: runs skill in sandbox mode.
- **SAVE:** Persists to `data/agents.json` + versioned backup in `data/prompts_history.json`.

## 2. X-Ray Execution Viewer

**Location:** Collapsible bottom drawer on `/chat` page

- **TOGGLE:** "🔬 X-Ray" button in chat topbar.
- **COLUMN 1 - Thinking Trace:**
  - Interactive expanded thoughts if model supports it.
  - Spinner for in-progress thoughts.
- **COLUMN 2 - Tool Calls Timeline:**
  - Chronological list of every tool call.
  - Color-coded by type: blue=web, yellow=file, red=shell, green=memory, purple=browser.
  - Duration badges + success/fail status with errors.
- **COLUMN 3 - Token Tracker:**
  - Live session token count + context limit progress bar.
  - Breakdown: system, conversation, tool result tokens.
  - Warning at 75% capacity.
  - Per-message cost breakdown.
- **HITL BREAKPOINTS:**
  - Dropdown to pause before specific tool types (e.g., shell_exec).
  - Modal with Resume/Abort/Edit options when triggered.

## 3. Multi-Agent Swarm Visualizer

**Location:** `/agents` page (new "Swarm" tab at top)

- **NODE GRAPH:**
  - Canvas-based (D3 or React Flow).
  - Node status colors: green=active, grey=idle, red=error, amber=waiting.
  - Directed arrows for communication paths (thickness = frequency).
- **SWARM TEMPLATES:**
  - Imported from `data/swarms.json`.
  - Strategy badges (sequential / parallel / round-robin / conditional).
  - Launch/Dry Run buttons.
- **SWARM BUILDER:**
  - Drag-and-drop agents onto mini canvas.
  - Connect and set routing strategies.

## 4. Memory Command Center

**Location:** `/memory` (new sidebar page)

- **MEMORY FILES BROWSER:**
  - File tree for `~/.openclaw/memory/`.
  - Monaco editor for .md files.
  - Full-text search across all memory files.
- **SUPERMEMORY INDEX:**
  - Semantic search integration.
  - Result cards with source agent, date, and project tags.
  - Deduplication tool with merge button.
- **PROJECT TAGS:**
  - Manager for tags like "imperial-vault", "competitor-intel".
  - Auto-tagging rules per agent.
- **CONTEXT PACKS:**
  - Editor for `data/contexts.json`.
  - Group memory files into packs for inclusion in system prompts.

## 5. Pipeline Autopilot Mode

**Location:** `/imperial-vault/autopilot`

- **AUTOPILOT TOGGLE:** Single switch for all 3 agents.
- **HEALTH SCORE:** 0-100 gauge (Batch completion, viral scores, cookie status, API quota).
- **SMART ALERTS:** Discord webhook config for specific failure triggers.
- **WEEKLY SUMMARY:** Automated reporting widget with "Post to Discord" button.
- **SETTINGS:** Global sliders for facts/day, viral threshold, clips/fact, etc.
- **MANUAL OVERRIDE:** Process control (Emergency Stop, Regenerate Failed, etc.).

## 6. Analytics & Performance Dashboard

**Location:** `/analytics` (new sidebar page)

- **PERFORMANCE:** Task completion, success rates, and duration per agent.
- **IMPERIAL VAULT SPECIFIC:** facts/day trend, viral score movers, category pie charts.
- **COST TRACKER:** API spend breakdown by provider with budget alerts.
- **SYSTEM HEALTH:** Uptime history, crash logs, and cookie refresh logs.
- **COMPETITIVE POSITION:** Trend tracking for channel views vs competitors.
