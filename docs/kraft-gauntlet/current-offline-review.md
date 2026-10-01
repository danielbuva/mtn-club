# Current offline review

Fresh independent review of production `http://127.0.0.1:3130/guide/kraft`, edition **2026-10-01-catalog-5**, on 2026-10-01, 21:51–21:55 UTC.

**Verdict: passes offline browser acceptance for the complete current runtime source catalog. Physical guidebook, real topo and field-device acceptance remain pending.** The downloaded catalog contains 78 source units and 383 canonical routes, independently of topo completeness. It retains 54 face selectors, 81 face-assigned routes (78 known / 3 provisional), one available photograph, ten low-confidence partial aerial surface candidates, and zero authored route overlays. Source units are not a verified count of physical rocks.

## Exact package receipt

The real **Download guide** action saved **38 resources / 5,186,349 bytes**. Every cached body was independently read, hashed with SHA-256, and compared with its declared length and hash. Cache keys exactly matched the manifest: no missing files, extras or mismatches. Static dependency references, all eight relative CSS font dependencies, and observed required browser resources resolve within this local package.

| Manifest kind | Files | Bytes |
| --- | ---: | ---: |
| Document | 1 | 2,876,843 |
| Image | 3 | 807,754 |
| Data | 4 | 186,677 |
| Web manifest | 1 | 485 |
| Stylesheet | 4 | 254,712 |
| Script | 17 | 942,266 |
| Font | 8 | 117,612 |
| **Total** | **38** | **5,186,349** |

Cached `/guide/kraft` SHA-256: `31d71e3dbe52ea3ffe7084888d3c98f64640df9121ed6ddeda7c3991687ced0a`. The actual streamed catalog, decoded from React serialization, hashes to `382beb0ae48cf16aadad73a626215195864e1324119eb7b507c3be1a156f203f`, matching the reviewed catalog JSON. The package descriptor and complete manifest remained identical before and after denied-network breadth interactions.

The eight declared local assets are the Pearl photograph, `geo-features.json`, `geo-surface-candidates.json`, web manifest, two icons and two license texts. Surface candidates are local vectors; aerial tiles and third-party reference photographs are neither shipped nor needed. The only packaged raster photograph is `/kraft/pearl-blm.webp`; the other two images are application icons. The document contains the local catalog, original route facts and provenance metadata. Separate research files are not package resources. Worker/import scripts are browser-managed service-worker resources, outside the 38-file package count.

## Fresh denied-network batch evidence

Used Playwright Chromium with a fresh persistent profile, 390 × 844 mobile/touch emulation, service workers allowed, and complete process close/relaunch. Cold relaunch combined browser offline controls with an unreachable proxy at `127.0.0.1:9` and disabled loopback proxy bypass. Both uncached same-origin and external probes failed. Navigation and reload returned HTTP 200 from the service worker. `navigator.onLine` still reported true; acceptance relies on actual denied transport, not that indicator.

All **14 independent checks passed**, with zero page errors:

- All 78 catalogs opened with exact owned route counts; both membership-only groups remained visible. Their 19 links opened existing canonical route parents without duplication.
- All 383 route names searched and opened locally. Every route displayed six independent dimensions matching the actual package: identity, grade, parent, face, topo and image. All 615 source-observation records were present in their route evidence sections; the first observation's facts and retrieval date were expanded for every route. Missing face/image/topo records stayed visible. The five disputed parents and 39 disputed grades remained qualified.
- All five source clusters and the separate OpenBeta group filtered locally: West 16, Cube 8, Main 33, Pearl 8, East 9, OpenBeta 4 catalogs. Grade bands retained 184 / 116 / 70 / 28 canonical routes respectively; ranges may cross adjacent bands. All-grades restored all 78 catalogs.
- All 54 face selectors switched locally. Direct catalog/route deep links navigated and refreshed across all six hierarchy groups. New known-face records, disputed-parent routes and native OpenBeta facts were inspected without requiring images or lines.
- The map retained all 78 source IDs and ten dashed candidates with explicit low confidence and incomplete-boundary/identity notes. Keyboard zoom/pan/reset and button zoom worked; candidate geometry scaled locally. The cached Pearl image loaded at 1800 × 1350. No real SVG route toggle could be accepted because no route geometry is authored.
- Warm refresh, two cold process reopens, source/fact browsing, list/search/filter/face navigation, and exact packet integrity passed with transport denied.

Screenshots of the offline map and disputed-parent content state were inspected. No required network dependency or missing required image was found. An optional analytics script attempted an uncached request and failed harmlessly. External source pages are not claimed available offline. A harmless cookie sentinel was absent from the saved public document; request-header privacy and fault resilience retain their prior separately scoped evidence below.

## Limits and retained evidence

This run accepts the current source-catalog software package. It does not certify physical boulder identity, aerial candidate accuracy, route paths, field conditions, complete photographic coverage or reconstructed production images. It does not accept a field-ready full guidebook merely because incomplete records are downloadable.

Physical iOS/Safari and Android devices, installed-PWA cold launch, real airplane-mode/GPS use, storage pressure and device quota behavior remain unverified. Same-size corruption, extra cache entries, failed/cancelled updates, partial/whole eviction, reconnect/redownload and explicit removal were independently exercised on **workbench-2**; those historical fault runs were not repeated against catalog-5. The prior workbench-3 four-unit acceptance was 37 files / 2,483,819 bytes, not this current package.

Exact current diagnostics, per-file hashes, per-route dimensions, screenshots and reproduction scripts remain in ignored scratch: `/Users/dani/Documents/code/unlv/mtn-club/.tmp/kraft-gauntlet/independent-catalog5-offline/results.json` (`critic.mjs` plus `extra.mjs`). Harness-only React dollar escaping, area-selector and same-document navigation assumptions were corrected before the final passing receipt; none was a product defect. No captures or persistent browser profiles are committed.

Prior fault/recovery receipts remain at `/var/folders/rh/r8sf83w900525v4chhl64b7c0000gn/T/kraft-independent-faults-FEqJnL/results.json` and `/var/folders/rh/r8sf83w900525v4chhl64b7c0000gn/T/kraft-recovery-fTpWJd/results.json`. See [offline test log](kraft-offline-test-log.md) for the current gate.
