# Current offline review

Status on 2026-10-01: baseline offline evidence is retained; the expanded guide
must be downloaded and independently retested after integration. Prior passes
apply to their exact four-rock editions, not full Kraft or real route coverage.

The final baseline receipt was 37 files / 2,479,795 bytes for
`2026-10-01-pilot-5`. A separate pilot-4 critic passed 16 functional checks after
independently matching every saved byte and SHA-256. Browser offline controls and
an unreachable proxy denied transport; refresh and full Chromium browser
close/reopen retained map gestures, local search/filter, face changes, climb
navigation and the 792,200-byte Pearl image at 1800 × 1350. Real SVG route toggling
could not be tested because none was authored.

Independent faults covered missing CSS, entire cache loss, same-size corruption,
cancelled/failed updates, removal, repair, anonymous credential omission and
account boundaries. Recovery is a self-contained document requiring no external
script, stylesheet, font or image. A later integration critic verified truthful
saved-edition mismatch/reload and reopening at a refused guide origin. Root's
final matrix reported 24/24 responsive/browser checks and repeated recovery.

The worker saves explicit fresh anonymous public-guide HTML and the exact local
resource closure, verifies cached read-back bytes, then commits atomically.
Failed updates retain the last verified edition. Scope is `/guide/`; account,
external and RSC requests are outside package delivery. Saved inventory exposes
edition, file kind, bytes and date. Eviction remains possible and is detected.

Safari cold offline and actual physical home-screen installation remain
unverified. The available WebKit harness also failed a minimal independent
service-worker baseline; warm behavior does not justify a cold-device claim.
No simulated GPS check proves field accuracy.

Reproduce software checks with `pnpm test` and
`pnpm test:kraft:browser`. Reports/traces are ignored under
`.tmp/kraft-gauntlet/`; `tests/kraft-offline-recovery-browser.mjs` uses OS temporary
storage. A fresh offline critic must download the actual expanded package, deny
all transport, refresh/relaunch and exercise map, multiple boulders/faces, real
route overlays and local discovery. Record the exact current package in the
[live offline log](kraft-offline-test-log.md).
