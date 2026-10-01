# Kraft guide workbench

The active goal is a finished offline Kraft guide covering every known area,
physical rock, face and climb across the reconciled source inventory. Work is in
progress. The previous four-boulder edition is a starting artifact, not the final
scope or an acceptance boundary.

Use the [priority tracker](TODO.md), [source policy](source-policy.md), and
[full content inventory](kraft-content-inventory.csv). The source inventory and
status boards are being expanded from Mountain Project, OpenBeta and TheTopo;
records must remain visible when imagery, geometry or identity is blocked.

The [current breadth checkpoint](current-status.md) records running-app counts
and the batch execution order. Pearl-specific UI polish is frozen while the
full inventory, imports, coordinates, face assets and route corridors advance.

## Preserved baseline

Edition `2026-10-01-pilot-5` contains four dated catalogs: Cube, Split Boulder,
Pearl and Monkey Bar Boulder, totaling 58 climbs. Ten face records have 14
source-backed climb assignments, three provisional assignments and 41 climbs
without a face. Four records retain unresolved physical-parent membership.

One lawful BLM Pearl context photograph is available. It is source-correlated to
the southeast face; field/photo-to-route review remains absent. No real Kraft
SVG route geometry is authored in that baseline. See the [Pearl rights record](pearl-photograph.md)
and the [baseline factual ledger](content-evidence.md).

The overview contains locally packaged OSM trail/road/wash/parking observations
and USGS elevation contours. Boulder symbols remain coordinate-based proxies,
not audited physical footprints. The [geography contract](geography.md) preserves
its source inputs and regeneration instructions.

## Current review understanding

Each review records its exact scope. Data and map reviews cover the expanded
source batch; earlier four-unit UI/offline receipts remain bounded prior evidence.

- [Data and provenance](current-data-review.md)
- [Map placement and shape](current-map-review.md)
- [Face imagery and topo](current-topo-review.md)
- [Offline and resilience](current-offline-review.md)
- [UI and integration](current-integration-review.md)

Opening a boulder must now show the boulder immediately, with a compact face
toggle and coordinated grade-sorted climb list. Finding directions stay
collapsed. Full coverage, map placement/shape, route facts, face accuracy,
field-use UI, offline relaunch and integration require fresh separate criticism
of the actual expanded artifacts.

The high-priority [independent reconstruction workstream](reconstruction-workstream.md)
continues alongside photography: Pearl is the photo control, Monkey Bar is the
proposed reconstruction pilot. The [structured provenance template](reconstruction-provenance-template.json)
and [Monkey research record](reconstruction-monkey-pilot.json) retain its evidence
gates. Plausible appearance is insufficient for production.

## Artifact discipline

Durable docs contain current facts, rights, blockers and review conclusions.
Screenshots, browser captures, numbered old reports and reference-only material
belong in ignored `.tmp/kraft-gauntlet/` or OS temporary storage. Previous-run
material was preserved locally in `.tmp/kraft-gauntlet/previous-run/`; it is not
part of the repository or the product. No application dependency uses that path.

The current software edition is `2026-10-01-catalog-6`: all 78 reconciled MP/OpenBeta
source catalogs and 383 canonical route records are visible, searchable and
filterable, with all selected source locations plotted. Catalog groups and
alternate memberships are qualified independently of physical rocks. Missing
faces, images, SVG lines or field review never gate record inclusion. Structured
factual dossiers and original summaries retain disagreements and source lineage.
All routes expose six independent content dimensions. The latest batch contains
81 face assignments, two independently reviewed moderate SVG corridors and ten low-confidence partial aerial surface candidates.

The fresh catalog-5 offline review verifies 38 resources / 5,186,349 bytes after
denied-transport browser restart, including traversal of all 78 catalogs and
383 route records. This verifies software and downloaded catalog coverage;
The current edition adds two real corridors on the approved Pearl photograph; most face imagery and topo coverage remain a major product gap.

`pnpm test:kraft:browser` writes reports and traces into
`.tmp/kraft-gauntlet/`. Retained `source-data/` files support the stable geography
rebuild, rights evidence and factual catalog regression; they are deliberately
excluded from the field download. No production deployment has been made by this
workbench.
