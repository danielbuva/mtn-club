# Kraft offline test log

Updated 2026-10-01. The current tested package is **2026-10-01-catalog-7**:
**38 resources / 5,036,347 bytes**, 78 source catalogs, 383 routes, 75 face/view
groups, 121 assigned routes, one original Pearl raster and two route corridors.
See the [current independent review](current-offline-review.md) for exact hashes,
receipt locations, tested actions and limitations.

| Evidence | Result and scope |
| --- | --- |
| Catalog-7 expanded content | PASS: all 78 catalogs, area/grade filters, 75 face selectors, source/provisional views, Caliman notice, map IDs, Pearl image and route interactions. |
| Current package integrity | PASS: actual download, exact keys, all cached body lengths/SHA-256, 23 static dependency references and unchanged final readback. |
| Warm denied transport | PASS: refresh served locally; uncached local/external probes failed. |
| Cold denied transport | PASS: persistent-profile process restart with dead proxy and loopback bypass disabled; local service-worker navigation succeeded. |
| Current restrained topo output | PASS offline at 390/1440 and short 320 px: one thin solid path, fixed width, markers shrink/fade then disappear, centered button zoom, selection, Clean and reset. |
| Compact face selectors | PASS: actual 320/390/1440 px output and cold offline source/provisional view switching. |
| Earlier catalog-5 exhaustive breadth | Historical PASS: every 383-route/source record; not rerun exhaustively in this unchanged-inventory delta. |
| Earlier workbench-2 fault/recovery | Historical PASS for tested corruption, update interruption, eviction and recovery; not current content-batch certification. |
| Physical devices / installed app / field GPS | Unverified; desktop emulation and denied-proxy checks do not establish these. |

Next: repeat real download/denied-transport/cold-start acceptance after a meaningful
approved face/overlay batch. Missing images and unreviewed geometry remain content
work, independently of runtime and offline visibility.
