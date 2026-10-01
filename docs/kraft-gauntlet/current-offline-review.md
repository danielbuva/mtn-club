# Current offline review

Independent review of production `http://127.0.0.1:3130/guide/kraft`, edition **2026-10-01-workbench-3**, on 2026-10-01 (fresh current run 20:11:22–20:11:43 UTC). Reviewed the actual browser and cached bodies; no old critic/builder explanations were used.

**Verdict: passes offline runtime acceptance for the current four-boulder content pilot. The complete Kraft guide is not accepted.** This package contains 58 climb records, 10 recorded face selectors, one available photograph, and zero authored route overlays. Missing photographs, face assignments, route identities, and route geometry remain visibly qualified. Saving this edition does not fill those gaps or include the broader Kraft inventory.

## Exact current package receipt

The real Download guide action saved **37 resources / 2,483,819 bytes**. Every cached body was independently read and checked against its recorded length and SHA-256. Cache keys exactly matched the manifest: no missing files, extra keys, or hash mismatches. The 36 discovered resource dependencies outside the document were all present.

| Manifest kind | Files | Bytes |
| --- | ---: | ---: |
| Document | 1 | 267,427 |
| Image | 3 | 807,754 |
| Data | 3 | 146,747 |
| Web manifest | 1 | 485 |
| Stylesheet | 4 | 251,652 |
| Script | 17 | 892,142 |
| Font | 8 | 117,612 |
| **Total** | **37** | **2,483,819** |

The document `/guide/kraft` includes the current records, local search/index data, face/geometry status, map rendering data, and hash-navigation metadata. Its current SHA-256 is `facadcf94f05c2dc6dbad1fc2b1a6b0cd8657aebf4798fbc5aaa8f97413dba01`. The seven declared local assets are `/kraft/pearl-blm.webp` (792,200 bytes), `/kraft/geo-features.json` (143,915), `/guide/kraft.webmanifest` (485), `/kraft/icon-192.png` (3,029), `/kraft/icon-512.png` (12,525), `/kraft/geo-license.txt` (1,449), and `/kraft/pearl-photo-license.txt` (1,383). Their bytes/hashes match the previous edition. The remaining 29 files are build scripts, stylesheets, and fonts. The worker and its two import scripts are browser-managed service-worker resources, outside this package count.

## Current browser evidence

Used installed Playwright Chromium with a persistent profile, 390 × 844 mobile/touch emulation, service workers allowed, and an actual complete browser-process close/relaunch. For the cold relaunch, both Playwright offline mode and a dead proxy at `127.0.0.1:9` were enabled, with loopback proxy bypass disabled. An uncached request failed; navigation and reload returned HTTP 200 from the service worker. This proves denied-network behavior independently of `navigator.onLine`, which reported true in the cold browser.

The fresh edition-3 run passed all **11 checks**, with no failed checks or page errors:

- Real public download, byte/hash/resource closure, warm offline refresh, and cold process restart.
- Direct offline entry to Cube / north face / Perfect Poser focused the Cube heading. Both Escape and Back to Kraft returned focus to the Kraft title. Opening Cube from its keyboard map trigger, moving to nearby Split, and closing restored focus to the original Cube trigger. Opening Monkey Bars from its search result and closing restored focus to that result.
- Map touch pinch and drag, wheel zoom, keyboard zoom/pan/reset, and a boulder tap.
- All four boulders: Cube 12, Split 9, Pearl 11, Monkey Bar 26 records. All 10 face selectors switched; all 58 climbs selected and their full facts and source links opened locally.
- Local searches for all 58 climb names, all four boulder names, and all four areas. Each area dropdown filter returned its expected boulder. Grade-band counts were 27 / 15 / 9 / 9; V2–3 records correctly appear in both adjacent bands. Empty results explicitly identify the pilot limitation.
- Boulder/face/climb hash deep links refreshed successfully for each boulder.
- Pearl's cached 1800 × 1350 photograph loaded, pinch/button zoom changed its rendered size, and touch pan changed scroll position. The image and notes honestly state that route lines await authoring/review; no real overlay toggle could be accepted because authored geometry is absent.
- No broken required images were observed. External source pages were not claimed available offline.

A second independent fresh-browser Chromium focus review passed six edition-3 keyboard cases: direct entry, both close actions, map opener with nearby navigation, boulder-list opener, and climb-search opener. Exact opening SVG/button elements received focus on return. This separate review ran online; the direct/map/search focus checks above also ran with transport denied.

Actual registration scope was `/guide/`; all 37 current download requests came from the worker without cookies or Authorization, despite a harmless test cookie being present. The cached document did not contain the cookie sentinel. Source inspection confirmed anonymous public-document acquisition, public-route session bypass, same-origin resource allowlisting, and exclusion of private/API/account/external resources from the package. No account-data leak was found. Analytics can still attempt an uncached script: this review claims no required network dependency, not zero attempted requests.

## Prior worker resilience evidence: edition 2

The fault matrix below was verified against **2026-10-01-workbench-2**, not rerun against edition 3. Edition 3 changed navigation/focus behavior; the current package and denied-network interactions were freshly tested above. These prior receipts support the existing worker resilience logic and must not be described as new edition-3 fault runs.

Five independent edition-2 fault checks passed: denied uncached private/external probes left the manifest unchanged; a failed update retained the previous exact verified package with no staging orphan; same-length CSS corruption caused SHA-256 recovery; an extra cache entry caused inventory recovery; and cancellation preserved the saved package. Restoring corrupted/extra entries restored ready status. The recovery screens were visibly styled, HTTP 503, asset-free, and provided a reconnect/reload action.

The existing recovery-browser script also passed five edition-2 scenarios: partial stylesheet eviction on refresh; cold process relaunch with that partial cache; whole package eviction; reconnect/redownload followed by offline refresh; and explicit removal followed by offline navigation. Recoveries returned the correct `incomplete` or `not-downloaded` header and did not mark damaged content ready. Both prior receipts saved 37 files / 2,483,666 bytes.

## Remaining acceptance limits and exact receipts

Physical iOS/Safari and Android devices, installed-PWA cold launch, real airplane-mode/GPS field use, actual storage pressure, and device quota behavior remain unverified. Simulated corruption/eviction recovery is proved for edition 2; browser retention under real device pressure is not. Complete Kraft coverage, lawful images for the other faces, and reviewed SVG route lines remain content blockers outside this limited runtime pass.

Screenshots, traces, and raw JSON remain outside the repository:

- **Current edition 3:** `/var/folders/rh/r8sf83w900525v4chhl64b7c0000gn/T/kraft-independent-offline-ahqKNA/results.json` (11/11 passed; all 37 per-file hashes, anonymous request flags, cold restart, direct-entry focus, and full current-content interactions recorded).
- **Current edition 3 independent focus review:** `/tmp/kraft-edition3-focus-receipt.json` (6/6 keyboard checks passed; fresh contexts, online).
- **Prior edition 2 faults:** `/var/folders/rh/r8sf83w900525v4chhl64b7c0000gn/T/kraft-independent-faults-FEqJnL/results.json` (5/5 passed).
- **Prior edition 2 eviction/recovery:** `/var/folders/rh/r8sf83w900525v4chhl64b7c0000gn/T/kraft-recovery-fTpWJd/results.json` (5/5 passed). Reproduction uses `KRAFT_TEST_URL=http://127.0.0.1:3130 node tests/kraft-offline-recovery-browser.mjs`; that script reads `KRAFT_TEST_URL`, not `KRAFT_BASE_URL`.
