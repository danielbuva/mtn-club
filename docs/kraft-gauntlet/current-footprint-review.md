# Current candidate footprint review

On 2026-10-01 a fresh critic, separate from both polygon authors, accepted **10
provisional visible-surface candidates at low spatial confidence**. No candidate
was rejected or blocked within this limited scope. These are incomplete surface
patches, with unresolved named-rock association and unobserved physical base
boundaries. **Zero complete physical footprints, named identities or field
verifications were accepted.** Production geometry, marker interaction and
uncertainty disclosure passed. No findings remain open in this scoped batch.

The review inspected the full locked USGS NAIP raster 134873, acquired
2022-06-11, all ten original crops and overlays, and five additional pixel-grid
windows. The nominal source resolution is 0.6 m; this export samples about
0.79 m per pixel. Enlargement adds no evidence. All ten raw crops match native
export pixels exactly: five 50 × 50 crops enlarged by nearest neighbor, and five
96 × 96 native crops. The reference and input hashes, per-candidate decisions
and exact limits are in the [independent receipt](source-data/geo-candidate-surface-review-2026-10-01.json).

Independent calculations reproduced all source-point projections and checked
every polygon vertex against the returned EPSG:3857 raster extent. Pixel-edge
coordinates transform as `x × 1192 / 1907`, `y × 800 / 1280`. Maximum recorded
rounding error is under 0.00005 map unit. All ten polygons remain inside the
raster, with no self-crossings. Published source coordinates remain unchanged.

The committed canonical source and generated runtime layer also passed an
independent transfer check: all ten native vertex lists and published points
match the reviewed scratch input exactly. Runtime IDs preserve the existing Cube
ID and nine distinct MP catalog IDs. The committed raw reference matches the
original raster SHA-256. Runtime vectors are rounded to two decimals, with
maximum error under 0.00501 map unit against the returned raster extent. The
receipt preserves the original scratch hash and adds canonical, runtime and
committed-reference hashes. Source transfer and rendered review are recorded as
separate checks.

Fresh catalog-5 production review at 320 × 800, 390 × 844 and 1440 × 900 px
confirmed all 30 rendered paths match their runtime vectors exactly. All 30
native marker activations passed with exact source memberships and returned
focus. Candidate paths are dashed, noninteractive and introduce no focus
targets. The legend identifies possible rock surfaces at low confidence; the
disclosure explicitly states incomplete outlines, unresolved associations and
omitted shaded faces/shadows. No new whole-footprint claims appeared. Native
zoom/pan inspection retained real scale; the smallest patches are subtle or
partly behind catalog circles at overview scale.

The critic found and closed a P2 disclosure defect: the longer About panel
overflowed the small map frame, clipping its summary, close button and initial
provenance. A bounded text region now scrolls independently beneath visible
summary/close controls. Fresh production rechecks passed at 320 × 800,
390 × 844 and 1440 × 900 px, plus a 320 × 568 px short-screen check. Initial
source text is visible, keyboard End reaches the candidate uncertainty, native
close hits the real close button, and focus returns to the summary. All eight
repaired-panel native-pixel captures were inspected. Source geometry was
unchanged, so its earlier exact-vector and marker passes remain applicable.

| Source catalog | Decision and limits |
| --- | --- |
| Mini Split Boulder | Accept pale western cap; weak ground transition and omitted dark eastern lobe. |
| Smooth Business | Accept small western patch; ground blends around several edges. |
| The Cube | Accept broader western cap; omit dark eastern lobe and separate southeastern patch. |
| $600 Boulder | Accept small upper western cap; exclude larger southwestern neighbor. |
| Angel Dyno | Accept small western patch; weak north/west edges, dark lobe excluded. |
| Around the World | Accept tiny grey western face only; nearby Split observation does not establish shared identity. |
| Barndoor Boulder | Accept small upper-west cap; weak cap-to-ground boundary. |
| Black Warm-up North | Accept northeastern patch; point lies in a gap west of it, so named association remains unresolved. |
| Black Warm-up South | Accept southwestern patch; point lies outside it to the southwest and must not be moved. |
| Bubble Butt Boulder | Accept small western cap; nearby Timepiece record remains a distinct source identity. |

The patches provide tentative local rock context. They do not establish the
correct named climbing face, route correspondence, complete scale or safe
approach. Dark faces and cast shadows cannot be reliably separated here, so
omitting them is appropriate. Weak pale-ground boundaries justify retaining low
confidence throughout the batch. Additional photography or field evidence can
improve these candidates without preventing provisional map content now.

The accepted map layer discloses low confidence, incomplete surface scope and
unresolved named association; retains independent neutral source markers; avoids
inflated silhouettes; and preserves distinct catalog IDs. The ten low-confidence
surfaces are useful tentative context, with their physical identity/base limits
unchanged. No Pearl UI, route, field-navigation or full-footprint acceptance is
part of this batch.
