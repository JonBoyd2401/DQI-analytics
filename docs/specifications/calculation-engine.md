# Calculation engine specification

**Purpose:** Calculate KPI formulas deterministically. The foundation supports typed literals, named references, and allowlisted add/subtract/multiply/divide nodes. Evaluation depth is capped at 32; unknown references fail; division by zero returns null; explanation renders the tree.

No `eval`, dynamic imports, source scripts, or arbitrary functions are permitted. Units, window functions, parser syntax, version persistence, and property-based generators are next-slice work.

Acceptance: 25 control findings / 500 AI requests × 100 = 5%; zero denominator returns null.

**Related:** CALC-001, PRD-001.
