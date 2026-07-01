# Golden evaluation dataset

Initial utterance: “Show weekly contact volume by team for the last 12 weeks.” Expected proposal: metric `metric.contact_volume`, dimension `dimension.team`, time field `dimension.contact_started_at`, range `last_12_complete_weeks`, grain `week`, visualisation `line`. Any DSL, unknown property, unknown ID, or unapproved field fails.
