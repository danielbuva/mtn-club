# Kraft guide workbench

The active goal is a finished offline Kraft guide covering every known area,
physical rock, face and climb across the reconciled source inventory. Work is in
progress. The previous four-boulder edition is a starting artifact, not the final
scope or an acceptance boundary.

Use the [priority tracker](TODO.md), [source policy](source-policy.md), and
[full content inventory](kraft-content-inventory.csv). The source inventory and
status boards are being expanded from Mountain Project, OpenBeta and TheTopo;
records must remain visible when imagery, geometry or identity is blocked.

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

These are compact summaries of the previous independent evidence, with its
limits. They are not fresh acceptance of the expanded guide.

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

The current software edition is `2026-10-01-workbench-3`, with the same four-unit
content boundary. It adds image-first detail and coordinated mobile selection.
Its actual production regression matrix passes 33 checks, and fresh independent
offline criticism verifies 37 resources / 2,483,819 bytes after a denied-network
browser restart. Full inventory and reviewed real topo coverage remain required.

`pnpm test:kraft:browser` writes reports and traces into
`.tmp/kraft-gauntlet/`. Retained `source-data/` files support the stable geography
rebuild, rights evidence and factual catalog regression; they are deliberately
excluded from the field download. No production deployment has been made by this
workbench.
