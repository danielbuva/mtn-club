# Kraft offline test log

Current expanded-guide acceptance: **pending**. Runtime is still the prior
four-boulder edition while source reconciliation and image-first UI repairs run.

| Evidence | Result and limit |
| --- | --- |
| Retained independent pilot-5 download/relaunch evidence | Prior Chromium package: 37 resources / 2,479,795 bytes; exact cached SHA-256 read-back, Pearl photo, cold reopen, search/map/details and fault recovery exercised. Summarized in [current offline review](current-offline-review.md). This does not certify new UI or full inventory. |
| Current unit checks, 2026-10-01 | 181 tests passed, including offline package/rollback/corruption/privacy checks. Worker simulations do not replace denied-network browser relaunch. |
| Current source acquisition | 370 MP / 245 OpenBeta source route entries available for reconciliation. They are not automatically in the downloaded runtime edition. |
| Expanded production browser test | Pending repair, build and actual network-denied relaunch. No claim that real Kraft SVG toggles were tested: none are approved yet. |
| Physical Safari / installed app | Unverified. Earlier harness limitations are not a device pass. |

Required next gate: start online, download the actual edition, verify exact
resource inventory, deny all transport, close/reopen or refresh, pan/zoom, open
map boulders, switch faces, select independently verified SVG routes, browse
facts, search/filter and cross the full guide. No broken images or core network
dependencies. Record edition, viewport/browser, exact package resources/bytes,
actions, failures and independent critic outcome. Scratch captures/traces stay
under ignored `.tmp/kraft-gauntlet/`; update this current record after each
meaningful acceptance pass instead of retaining numbered histories.
