# Traceability matrix

| Requirement | Specification | Implementation | Test/status |
|---|---|---|---|
| PRD-001 / CALC-001 | calculation-engine.md | analytics-core/calculation.ts | complaint rate + zero denominator, implemented |
| SEM-001 | semantic-layer.md | contracts + semantic-model.ts | unknown metric rejection, implemented |
| QUERY-001 | query-ir.md | planner.ts + compiler.ts | planning/compilation tests, implemented |
| QUERY-002 | connector-contract.md | Connector + SyntheticConnector | deterministic execution, partial |
| WIDGET-001 | widget-specification.md | web/App.tsx | build verification, partial |
| AI-001 / AI-002 | ai-gateway.md | AIProvider contract | provider pending |
| SEC-001 | security-model.md | strict schemas/source binding | adversarial basics implemented; identity pending |
| PRD-003 / OBS-001 | provenance.md | service.ts + inspector | provenance assertions, implemented |
