# Golden evaluation dataset

Initial utterance: “Show the EU AI Act control finding rate by integration for the last 12 weeks as an area chart.” Expected proposal: metric `metric.policy_violation_rate`, dimension `dimension.integration`, range `last_12_complete_weeks`, policy pack `eu-ai-act-2024-1689`, grain `week`, visualisation `area`. Unknown IDs, user-supplied DSL, unsupported visual types, and unapproved fields fail or are explicitly reported as not applied.

Decision comparison: “Compare blocked vs passed AI usage by decision.” Expected metric `metric.ai_requests`, dimension `dimension.decision`, and series for Passed, Blocked, and Review.

Policy attribution: “Which DQI Enforce policy picked up critical events in production?” Expected metric `metric.enforce_policy_hits`, dimension `dimension.enforce_policy`, filters `environment = Production` and `severity = Critical`, and deterministic query terms for both filters.
