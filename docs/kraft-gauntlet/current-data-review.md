# Current Kraft data review

Reviewed 2026-10-01 against the expanded goal, current production modules, generated CSV/boards, cached MP HTML and cached OpenBeta SSR records. **Source inventory capture is accepted for the acquired MP/OpenBeta trees; the finished Kraft guide is not accepted.** Research coverage and runtime coverage remain very different.

All 81 cached MP area pages reconcile to 80 child edges and 370 unique direct route memberships; recursive advertised totals and cached breadcrumb parents match. All 49 acquired OpenBeta areas and 245 route IDs are represented. Independent UUIDv5/NIL checks validate 42 area links and 232 route links. The reconciled ledger therefore contains 78 source-unit identities and 383 route identities, not verified physical-rock/problem counts. The CSV has 1,025 observations: 451 MP, 294 OpenBeta and 280 separately indexed TheTopo research observations. TheTopo's 34 units, 198 routes and 48 views remain unreconciled; no further automated access was used.

Current OpenBeta names and the area path token correctly decode `$600 Boulder`, `$600` and `$500`, matching the cached rendered title/list. The decoder preserves literal UTF-8 text records and unescapes model-string dollar prefixes once. All 49 area and 245 route retrieval dates match their source caches. Source grades, types, safety, first ascent, content, coordinates and memberships remain preserved; correlated importer lineage is explicitly qualified.

The MP mixed-grade importer passes direct comparison with all 370 cached route headings, including all eight reported grade spans for each of these routes:

| Route / MP ID | YDS | Literal V | Font | Risk |
| --- | --- | --- | --- | --- |
| Front Side Crack / 106617793 | 5.8 | V0 | 4 | R |
| Leaning Wide Crack / 106629920 | 5.9 | V1 | 5 | — |
| Plumber's Crack / 107185645 | 5.9 | V2 | 5+ | R |

MP uses `rateYDS` for both YDS and V spans; the inventory preserves the literal values, source classes/labels and observations separately. Runtime records retain the three YDS grades alongside the selected V grades. Current reconciliation compares within V/YDS/Font systems: OpenBeta's matching 5.8/5.9 reports no longer become false disagreements. Genuine differences remain visible, including Apple Cider V4 versus V2+; 38 groups have shared-system grade differences. All five inventory/serialization regressions pass. Front Side Crack's OpenBeta name, “Plumbers Crack (North side chimney),” is preserved under the exact imported route identity rather than merged with the south offwidth by name.

Runtime-presence flags currently agree with the actual catalog: four units and 58 climbs; the 48 linked OpenBeta climb observations correctly have `runtime_record=true` but `runtime_source_reference=false`. A true flag means the canonical catalog record exists, not that its face or route line is usable. Runtime has 58 synopses, 10 faces, 17 face-assigned climbs, one context photograph and zero authored overlays. All 383 ledger routes remain blocked: 346 on geometry/evidence and 37 on identity. The five conflicting numeric source parents, 19 unmatched legacy parents and 13 unlinked OpenBeta routes remain explicit. Eight MP coordinate outliers are preserved rather than substituted for physical-unit locations.

Largest remaining gaps:

- Full factual and runtime coverage is unfinished. Cached MP records contain 369 non-placeholder descriptions and 299 locations; 312 omitted routes already have descriptive evidence. The broad inventory does not yet carry reconciled starts, corridors, finishes, constraints, aliases and physical face assignments into the runtime/search/offline guide. Missing face imagery does not explain all of this factual gap.
- Physical identity still needs editorial reconciliation beyond database-parent IDs. Leaning Wide Crack is listed under Split, but its cached description/location places it on a separate north-facing rock to the north. Runtime qualifies that assignment and omits a Split face; the canonical inventory still represents source hierarchy. Grouped rocks, unresolved TheTopo crosswalks, lawful face assets and independently supported overlays prevent full-guide acceptance. Actual SNB III content and independent KAYA factual coverage have not been established here.
