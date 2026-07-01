# Connector contract specification

Connectors receive only validated Query IR plus deterministic compiled DSL and return normalized points and freshness. Connector IDs must equal the semantic model source binding. Production implementations MUST use read-only credentials, TLS, timeouts, cancellation, capability discovery, and response-size limits.

The synthetic connector is deterministic and contains no PII. Real Elasticsearch/OpenSearch clients and version matrices are the next connector slice.

**Related:** QUERY-002, SEC-001.
