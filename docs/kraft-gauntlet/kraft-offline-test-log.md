# Kraft offline test log

Current **catalog-5 source-catalog offline acceptance passes**. Full physical guidebook and field-device acceptance remain pending. Offline availability is independent of face, image, topo and field completeness.

| Evidence | Result and limit |
| --- | --- |
| Fresh independent production download, 2026-10-01 | Edition `2026-10-01-catalog-5`: **38 files / 5,186,349 bytes**. Every cached body matches its length and SHA-256; exact manifest inventory, static dependencies and all CSS font references close locally. |
| Actual downloaded content | **78 source catalogs / 383 canonical routes**, 54 face selectors, 81 face-assigned routes, one photograph, ten low-confidence partial aerial candidates and zero authored overlays. All six route dimensions remain independent and incomplete routes remain visible. |
| Denied-transport process restart | Fresh persistent Chromium mobile profile, 390 × 844. Complete process close/relaunch with browser offline controls, unreachable proxy and disabled loopback bypass. Uncached same-origin and external probes fail; guide navigation/reload returns 200 from the service worker. |
| Independent breadth interactions | **14/14 checks passed**, zero page errors. Every catalog opens, every canonical route searches/opens local facts/dimensions, all six hierarchy groups and grade bands filter, all face selectors switch, 19 membership-only links open canonical parents, deep links reload across all groups, map vectors/controls and the cached photo work. |
| Integrity after interactions | Package descriptor, complete manifest and every cached body remain identical. No required transport dependency, missing required image, reference-only raster or aerial tile is needed. Optional analytics may attempt and fail an uncached request. |
| Prior worker resilience | Workbench-2 independent failed/cancelled updates, same-length corruption, extra entries, eviction, recovery/redownload and removal passed. Historical receipts remain scoped to that edition; they are not new catalog-5 fault tests. |
| Physical Safari / installed app / field GPS | Unverified. Desktop Chromium emulation and denied-proxy tests are not physical-device acceptance. |

The cached document SHA-256 is `31d71e3dbe52ea3ffe7084888d3c98f64640df9121ed6ddeda7c3991687ced0a`. Actual decoded runtime catalog SHA-256 is `382beb0ae48cf16aadad73a626215195864e1324119eb7b507c3be1a156f203f`. Resource closure is one document, three images, four data files, one manifest, four stylesheets, 17 scripts and eight fonts. Browser-managed service-worker/import resources are outside that package count.

Exact current diagnostics and screenshots stay in ignored `.tmp/kraft-gauntlet/independent-catalog5-offline/`; the [current independent review](current-offline-review.md) records receipt paths, actions, scope and limits. Update these current records after a meaningful content batch instead of repeatedly critiquing the Pearl interaction.

Next meaningful gate: repeat the actual download/integrity/denied-network restart workflow after enough approved face imagery and real SVG corridors exist to test them. Exercise source-qualified routes across a completed cluster, plus actual physical-device cold launch, airplane mode, storage retention and field GPS when available. Current software acceptance does not fill missing images or certify physical geometry, topo accuracy or field conditions.
