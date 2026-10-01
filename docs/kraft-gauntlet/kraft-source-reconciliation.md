# Kraft source reconciliation

Current acquisition: 2026-10-01. All 78 reconciled MP/OpenBeta source catalogs
and 383 canonical routes are included in the running `2026-10-01-catalog-4`
edition. Basic attributed identity/parent records appear independently of face,
image, SVG or field-verification completion.

| Source | Acquired scope | Identity / reuse limits |
| --- | --- | --- |
| Mountain Project | 81 areas: root, five sectors, one subgroup, 74 leaf source units; 370 unique routes. All hierarchy totals and listing/detail grades reconcile. | Factual metadata and original summaries only. Source units may contain multiple rocks. Public comments are incomplete where sign-in is required; no access bypass. |
| OpenBeta | 49 areas including root, 46 leaf units; 245 unique routes, 57 nonempty descriptions. All descendants acquired. | Non-photo content is CC0; photographs excluded. Its imported MP lineage makes many observations correlated. Synthetic area polygons are not footprints. |
| TheTopo | 34 source units, 198 routes, 48 views; 163 routes associated with views and 35 undrawn. | Research index only. Automated acquisition stopped when the [published terms](https://thetopo.com/site/terms) constraint was found. Policy/downstream-use review pending; no runtime imports, source pixels or topo points. |
| Southern Nevada Bouldering III | Publisher product/FAQ inspected; actual book contents not available in this workspace. | No claim that Kraft route facts were cross-checked against the book. |
| KAYA / Topo Guru / Mountain Project mobile | Public primary product pages inspected for field and offline expectations. | Marketing pages do not provide a complete independently reviewed Kraft dataset. Paid media/content not acquired or shipped. |

OpenBeta's official importer derives route UUIDs from MP numeric IDs using
UUIDv5 with the NIL namespace. The [retained provenance](source-data/openbeta-provenance.json)
records the official code and license. Exact links identify 232 routes and 42
areas; they establish import identity, not fresh independent field confirmation.
The 13 unlinked OpenBeta routes remain distinct unresolved records. Nonleaf
OpenBeta hierarchy keys differ, so similar area names alone never force a merge.

Five exact route IDs have different MP/OpenBeta source parents: Right V1 and four
Lava/Bowling Ball entries. Additional exact route links have unmatched legacy
OpenBeta parent units. Keep their physical memberships unresolved until source
reorganization versus physical rock identity is established. Do not relabel an
entire source parent as one rock merely to make counts align.

The [content CSV](kraft-content-inventory.csv) preserves each source observation,
its parent, name, V/YDS/Font grade, coordinates, date, confidence, discrepancy and
canonical runtime-presence flag. A separate flag records whether that particular
source URL is cited at runtime. Exact-ID groups use a provisional current MP inventory
label; this is not a final editorial grade decision. Source grade disagreements
are compared within the same grade system and retained without averaging. A
matching YDS observation does not contradict a mixed YDS/V record merely because
one source omits its V grade. TheTopo entries retain their own source IDs
pending an evidence-backed crosswalk; do not add their source count to MP as a
count of unique real-world climbs.

The four existing catalogs retain individually studied face qualifications.
All 370 acquired MP routes now have independently source-reviewed original
factual dossiers: [West/Cube](source-data/route-facts-west-cube.json),
[Pearl/East](source-data/route-facts-pearl-east.json),
[Main A](source-data/route-facts-main-a.json) and
[Main B](source-data/route-facts-main-b.json). They preserve starts, general paths,
finishes, constraints, source-linked aliases and unresolved observations at the
resolution supported by actual prose. Their 232 exact-ID OpenBeta observations
remain correlated imports, not independent physical confirmation. Missing fields
stay empty; original source paragraphs are not redistributed in those dossiers.
The dossiers are integrated into runtime records; physical-face/route
correspondence remains unfinished. Source facts support explicit face assignments
and broad documented corridors where evidence permits, without exact hold
sequences. Missing evidence limits visualization rather than visibility.
Original MP source prose/photos remain in ignored research
only; OpenBeta descriptive content has separate CC0 provenance. The final guide
must not require shipping a reference-only image.

## Reproduce the inventories

Use `node scripts/acquire-kraft-mp.ts` and
`node scripts/acquire-kraft-openbeta.ts` for the public-source checkpoints. Their
normal cache reuse is limited to one day; `--refresh` requests fresh retrieval
and `--cache-only` explicitly replays existing dated evidence without claiming
it is newly fetched. `node scripts/acquire-kraft-mp.ts --verify-cache` also checks
literal grade selectors against all cached pages. Source HTML remains ignored.

`node scripts/promote-kraft-openbeta.ts` creates the non-photo CC0 seed and
provenance from its checkpoint, using exact importer IDs against the tracked MP
inventory. React Flight escaped literal dollar names are decoded once; raw text
records stay literal. Per-record retrieval times survive replay. Then run
`node scripts/build-kraft-workbench.ts` to regenerate the five current inventory,
status, rights and placement artifacts. No tool publishes acquired media.

Next: batch separate completeness dimensions, source-backed face assignments,
confidence-rated candidate footprints and separately supported route corridors.
Reserve deep research for physical identity/source conflicts. Full inventory capture
does not approve route geometry, maps, imagery or the assembled field guide.
