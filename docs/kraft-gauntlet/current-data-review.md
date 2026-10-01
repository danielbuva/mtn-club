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

## Expanded route-fact prose review

A fresh independent pass accepts [West/Cube](source-data/route-facts-west-cube.json) and [Pearl/East](source-data/route-facts-pearl-east.json) as source-linked factual observations for **192 of 370 MP routes**, at the resolution supported by their prose. This is documentation acceptance, not runtime, physical-face or overlay approval.

| MP sector | Routes reviewed / inventoried | Source parents reconciled |
| --- | --- | --- |
| West Cluster | 63 / 63 | 17 |
| Cube Area | 31 / 31 | 7 |
| The Pearl Area | 30 / 30 | 8 |
| East Cluster | 68 / 68 | 9 |

All 192 route IDs are unique, with no missing or extra scoped routes. Every source-parent count matches the inventory; these 41 memberships establish database hierarchy rather than physical-rock boundaries. All 384 cached MP Description/Location section slots match the extraction after HTML decoding. IDs, URLs, retrieval dates, cache dates and section availability match. All 106 exact-ID OpenBeta observations match their inventory entries: 16 have prose and 90 have neither requested section. OpenBeta remains correlated MP-import evidence. Source-name differences and parent conflicts are retained; the synopses are short factual paraphrases.

Unknowns remain explicit: the MP observations lack a face assignment for 69 routes, a start for 23, a path for 7 and a finish for 92. Perfect Poser (`105959433`) has neither requested MP section and no OpenBeta prose. The other routes lacking a prose path are Red Ball Jets (`110174744`), Arête (`202547654`), Across the Choss (`107030493`), Six Pack (`107030486`), Umpa Lumpa (`108551582`) and West Face Right (`124064612`). These gaps do not authorize inferred line geometry.

The dossiers preserve seated/crouched/standing variants, feet-only and detached-rock exclusions, alternative exits and contested eliminates. Specific unresolved evidence includes the historical January 2024 Bang landslide; The Pearl's crimp/sidepull and hold-break chronology; Left (`114126051`)'s conflicting left/right placement on Monkey Bar; Maxy Forever's standing reference versus I Disagree's seated start; and the ambiguous rock/line wording behind Lava. Umpa Lumpa's separate rock and Darwin Award/Glory Hole's leaning shelter rock remain distinct physical-identity questions. Documented aliases and the named `12 Monkeys` whole-link variant are retained without turning variant grades into standalone-route grades.

## Main Area and full acquired MP corpus

Two separate fresh-context critics subsequently read all 178 Main Area route
pages and their 126 exact-ID OpenBeta observations. [Main A](source-data/route-facts-main-a.json)
contains 89 MP and 57 OB observations; [Main B](source-data/route-facts-main-b.json)
contains 89 MP and 69 OB observations. Their source-fidelity repairs were verified
against actual cached HTML before scoped acceptance. Repairs preserved qualifiers,
right-side versus hand assignments, uncertain corner/exit locations and distinct
named finishes. Fin Face's MP left/middle versus OB right apex remains a concrete
conflict. Linked entries and source-name/parent differences remain qualified.

The four dossiers now cover all **370 acquired MP routes** with **602 observations**:
370 MP and 232 correlated OB entries. The remaining 13 unlinked OB routes retain
their separate source inventory; these dossiers do not reconcile those identities
or the independently indexed TheTopo research. MP prose is present for 369
Descriptions and 299 Locations; the exact-linked OB subset has 47 descriptions
and no captured Location prose. Missing MP factual fields remain explicit:
127 face descriptions, 48 starts, 19 paths and 172 finishes. A recorded textual
face description is not an approved physical face/view assignment.

Fresh critics accept these as original source-observation dossiers, with ID,
parent, date, availability and correlated-import integrity checks passing. The
three full-corpus regression checks cover missing records, source identity/date
drift and accidental facts supplied for absent sections. They do not establish
climbing correctness by themselves; the independent source comparisons do.

The accepted dossiers have not expanded the four-unit/58-climb runtime, supplied
lawful face assets or established image-relative route corridors. Full-guide
acceptance remains blocked by runtime/physical-unit reconciliation, the gaps
above and the existing map, imagery and geometry work.
