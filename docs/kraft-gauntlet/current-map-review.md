# Current map review

Status on 2026-10-01: full-Kraft placement and footprint audit is in progress.
The expanded map encloses 78 source catalog locations, with neutral points and
clusters. Physical field identification and recognizable rock footprints remain
unverified.
Previous navigation/GPS UI passes are not spatial acceptance of the expanded map.

The baseline selected parent-coordinate observations are:

| Boulder | Latitude | Longitude |
| --- | --- | --- |
| The Cube | 36.15974 | -115.41913 |
| Split Boulder | 36.15993 | -115.41713 |
| The Pearl | 36.15924 | -115.41487 |
| Monkey Bar Boulder | 36.16154 | -115.41099 |

Earlier independent source inspection confirmed these as published Mountain
Project parent points. Contradictory route points and nearby TheTopo comparisons
remain in `lib/kraft/location-observations.ts`; coordinates were not averaged.
No selected point has field verification. Repeated invented rock silhouettes
have been removed. Neutral source points and cluster centers carry no physical
shape, scale, rotation or single-rock identity claim.

The rebuilt local geography contains 117 OSM/USGS features and 6,197 vertices. Its
[geography contract](geography.md) and [provenance](source-data/geo-provenance.json)
state expanded bounds, licensing, exact raster extents, inputs and processing.
All 74 MP leaf units and four unlinked OB units lie within the envelope; 13
western MP units previously fell outside. OSM paths do not prove each final
boulder approach, and the envelope does not include the entire hiking loop.

Prior independent gesture checks exercised native map pan/pinch, wheel and
keyboard controls, source disclosure, filter return and dated GPS states. The
Split grade-envelope discrepancy was repaired in the integrated baseline. These
checks do not establish real device GPS accuracy or surveyed destinations.

Next physical acceptance requires every source unit's retained observations,
selected coordinate rationale, discrepancy distances, confidence and field
status, plus lawful aerial/physical footprint evidence where possible. Neutral points
make the map usable for catalog lookup while recognizable physical geometry
remains quality debt. A fresh map critic must compare actual landmarks,
relative positions, footprints and field navigation against source evidence.
See the live [placement audit](kraft-map-placement-audit.md).

## Expanded source batch, 2026-10-01

New bounds are W −115.4260 / E −115.4093 / S 36.1562 / N 36.16525; the world
is 1192 × 800 so the enlarged western coverage preserves the metric scale.
USGS 3DEP and locked public-domain NAIP raster 134873 were successfully exported
for this exact extent. After three recorded Overpass failures, the official
OpenStreetMap API supplied a western-strip extract; original and supplemental
observations retain their source IDs and complete node closure.

Mechanical verification passed 7/7 geography tests: all 78 source points within
bounds and invertible, metric scale/source vectors valid, clusters preserve
coincident unresolved IDs, and committed geographic files match SHA-256 receipts.
A nearby-catalog chooser replaces overlapping labeled rock glyphs. These checks
are implementation evidence, not independent spatial or field acceptance.

Independent lawful NAIP inspection of the four pilot locations found distinct
rock-like landmarks. Cube and Monkey are clearer candidates, Split is crowded,
and Pearl is very small at the approximately 0.79 m export sampling. Shaded
faces and cast shadows blend; no complete physical footprint was accepted.

A fresh independent critic completed the full 78-source review in eight batches
of approximately ten. Source retention, projection, extent, provenance, distinct
IDs and bounded clustering passed. There are 18 distinct patch opportunities,
43 small/crowded ambiguities and 17 apparent gaps; no physical footprint or new
identity was accepted. The committed [receipt](source-data/geo-placement-review-2026-10-01.json)
retains per-record classifications and file hashes. Revised clustering produces
nine local clusters in hypothetical 320/390 px map containers, with every pair
inside a cluster under 44 screen pixels. Actual production map containers at
320/390/1440 px viewports render seven/nine/eighteen local clusters. All 78 IDs
remain visible; no West record is lost.

Fresh rendered review found a 390 px hit-target overlap: tapping one 20-record
cluster center opened a nearby five-record chooser. Pointer activation now
resolves the nearest visible center through the SVG screen transform and retains
that center's actual opener. A center-click regression covers exact memberships.
The fresh build and independent interaction recheck are pending. Final field
acceptance remains open; parking/trail labels also crowd at 320 px.
