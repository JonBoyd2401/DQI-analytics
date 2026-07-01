# Threat model

## Protected assets

Source credentials, tenant data, PII, semantic definitions, permissions, query capacity, audit evidence, and model prompts.

## Principal threats and controls

| Threat | Control |
|---|---|
| Prompt injection in transcripts | Treat retrieved text as delimited untrusted data; never source instructions from it |
| Fabricated metric or field | Strict schemas plus semantic ID resolution |
| Model-generated DSL | Model output contract excludes DSL; deterministic compiler owns DSL |
| Cross-tenant access | Policy enforcement before planning plus source-bound credentials |
| Query exhaustion | Time, bucket, timeout, concurrency, and cost limits |
| Fabricated numerical explanation | Claim-to-result provenance validation |
| Secret leakage | Indirect secret references, redacted telemetry, no credentials in prompts |

Residual risks include backend capability differences, high-cardinality source mappings, model behaviour changes, and administrators granting overly broad source credentials.
