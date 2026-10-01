# Current map review

Status on 2026-10-01: full-Kraft placement and footprint audit is in progress.
The existing four-rock map is unverified for physical field identification.
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
No selected point has field verification. The fixed rock drawings are symbols,
with no measured outline, scale or rotation.

The preserved local geography contains 98 OSM/USGS features. Its
[geography contract](geography.md) and [provenance](source-data/geo-provenance.json)
state bounds, licensing, inputs and processing. The pilot envelope is not a
complete Kraft coverage claim. OSM paths do not prove each final boulder approach.

Prior independent gesture checks exercised native map pan/pinch, wheel and
keyboard controls, source disclosure, filter return and dated GPS states. The
Split grade-envelope discrepancy was repaired in the integrated baseline. These
checks do not establish real device GPS accuracy or surveyed destinations.

Next acceptance requires every mapped rock's MP/OpenBeta/TheTopo observations,
selected coordinate rationale, discrepancy distances, confidence and field
status, plus lawful aerial/physical footprint evidence where possible. Generic
symbols remain quality debt. A fresh map critic must compare actual landmarks,
relative positions, footprints and field navigation against source evidence.
See the live [placement audit](kraft-map-placement-audit.md).
