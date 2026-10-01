# Kraft breadth checkpoint

Updated 2026-10-01. The existing goal continues on
`feat/kraft-offline-guidebook`. Pearl-specific UI polish is frozen; its current
presentation is sufficient to establish the interaction pattern.

Counts below describe the running `2026-10-01-workbench-3` edition, not unfinished
working-tree expansion. Source-unit identities are not a verified physical-rock
count. TheTopo records remain separately tracked pending identity/source-use
review and cannot simply be added as unique rocks or problems.

| Measure | Current count |
| --- | --- |
| Known MP/OpenBeta boulder/source-unit identities | 78; plus 34 separate TheTopo research units |
| Imported runtime boulder catalogs | 4 |
| Known MP/OpenBeta route identities | 383 (370 MP + 13 unresolved OpenBeta); 198 TheTopo research records remain unmerged |
| Imported runtime routes | 58 |
| Mapped runtime boulders | 4 source points; no accepted physical footprints |
| Boulders with face assets | 1 |
| Routes with face assignments | 17: 14 source-backed, 3 provisional |
| Routes with authored overlays | 0 |
| Routes blocked from topo use | All 383 inventory identities: 346 geometry/evidence, 37 identity/conflict; all 58 runtime routes lack overlays |

Full source acquisition and original factual dossiers for all 370 acquired MP
routes are committed. The current batch imports all 78 source catalogs and 383
route identities, preserves exact source links and unresolved legacy memberships,
then maps the full coordinate set. It is not counted as imported until the
application builds and the batch passes its integrity checks.

Execution order:

1. Complete the canonical inventory and explicit unresolved identities.
2. Import every available unit and route; preserve blocked records visibly.
3. Reconcile and map coordinates in batches, retaining centroid/proxy uncertainty.
4. Produce lawful face assets in batches; allocate insufficient evidence to field
   photography or blocked reconstruction.
5. Produce independently supported route corridors in batches.
6. Review meaningful batches: about 50 routes or one cluster for data; about 10
   mapped units; 5–10 boulders with completed faces; 25–50 overlays; one completed
   cluster for UX/integration. Run offline criticism when real content makes a
   meaningful download, retaining existing software regressions.
7. Reserve deep research for disagreements and low-confidence records. Use
   automated exact-ID reconciliation first for agreeing records.

Finished work is committed incrementally. Active runtime/map changes are a
declared implementation batch, not finished work or a publication claim.
