# Kraft geography workbench

Updated 2026-10-01. The static north-up map now encloses every one of the 74
Mountain Project leaf source units and four unlinked OpenBeta leaf units. These
are **78 catalog records**, not a count of physical rocks. No field-map or
physical-footprint acceptance is claimed.

## Coordinate contract

`lib/kraft/geography.ts` exports a **1192 × 800** Web Mercator world. WGS84 bounds
are west **−115.4260**, east **−115.4093**, south **36.1562**, north **36.16525**.
The ground envelope is approximately **1501 × 1007 m**. The width increased from
1000 to 1192 world units as the western boundary expanded, preserving metric
x/y scale to about 0.02% rather than stretching the old map. North stays at y=0.
`projectLocation`, `unprojectLocation` and `worldUnitsForMeters` share the same
contract. Projection tests cover all 78 source-unit points and round trips.

The leaf observations occupy W −115.42506 / E −115.41099 / S 36.15918 /
N 36.16352. The old −115.4233 western edge excluded 13 MP West Cluster units.
The enlarged envelope includes parking and southern Kraft Mountain context; it
does not claim to cover the complete Kraft Mountain hiking loop.

## Lawful geographic evidence

| Layer | Source | Redistribution | Qualification |
| --- | --- | --- | --- |
| Trails, roads, washes, parking and peak | OpenStreetMap, original Overpass extract plus official API western-strip supplement | ODbL 1.0; attribution and derivative database retained | Community observations, not final verified boulder approaches; private roads excluded |
| Contours | USGS 3DEP bare-earth F32 export acquired 2026-10-01 | US public domain | New 596 × 400 grid over the exact enlarged EPSG:3857 extent; roughly 2.52 m ground sampling; 20 m contours |
| Aerial audit reference | USGS/USDA NAIP, locked raster 134873 | US public domain | June 11, 2022 USDA-FSA-APFO imagery; nominal source resolution 0.6 m; 1907 × 1280 export samples roughly 0.79 ground m/pixel |
| Candidate visible surfaces | Native pixel traces from the same lawful NAIP export | US public domain | Ten low-confidence partial surfaces; shaded faces/cast shadows omitted; named associations unresolved and bases unobserved |
| Catalog locations | MP parent areas and unlinked OpenBeta source-area centroids | Factual observations with retained source links | Unknown positional accuracy; correlated imports do not independently verify a point; source unit is not necessarily a physical rock |

The new western OSM extract uses the official
`https://api.openstreetmap.org/api/0.6/map?bbox=-115.4265,36.156,-115.424,36.166`
endpoint. It retains 26 relevant complete ways from the returned OSM XML. Native
node references create the source line geometry; exact way IDs reconcile overlap
with the original extract. Every element retains its observation source ID.
Three unsuccessful expanded Overpass attempts are recorded in provenance before
the successful native API acquisition. No proprietary map artwork was acquired.

All OSM ways are projected and clipped to the same envelope. Douglas–Peucker
simplification stays within 0.5 world units (about 0.63 m) of those lines. The DEM
builder projects each sample using the raster response's **reported extent**;
retaining an older DEM would retain its older georeferencing rather than stretch
it across new bounds. Marching squares derives elevation contours, not rock
outlines. Survey accuracy cannot be inferred from these processing tolerances.

## Rendering and physical-identity limits

Small neutral points replace the four repeated invented rock silhouettes.
Screen-space aggregation joins nearby source records while preserving every ID.
Every pair in a cluster stays within 44 screen pixels; proximity chains cannot
combine distant catalogs into one center.
Cluster centers are visual aggregates, not new geographic observations. A
keyboard-accessible chooser exposes each source record, including coincident MP
and unresolved OB Tomahawk records. Selected labels remain at the source point.
An OpenBeta generated bbox or polygon is never a physical rock footprint.

No numerical accuracy or physical identity is invented. The eight MP route-to-
parent coordinate outliers remain in the source inventory and are excluded from
map placement. MP source parent points are selected instead. Conflicting OB
area centroids remain comparison evidence, including Big Jugs (182 m), Short
Cube (855 m), Pretzel (481 m), Big Mac Crack (111 m), and Andy's Candies (155 m).

A separate lawful aerial inspection finds four distinct rock-like landmarks
near the four pilot points. Cube and Monkey are clearer candidate landmarks;
Split is crowded, and Pearl spans only about ten export pixels. Shaded rock
faces and cast shadows merge, so none has an accepted full physical footprint.
The former manually drawn sandstone tint was removed rather than relocated as
unmeasured geology. Recognizable boulder geometry remains a field/photo evidence
gap, and physical acceptance remains open. An independent eight-batch source review
passed all 78 coordinate/transform/identity/provenance checks; its per-record
[receipt](source-data/geo-placement-review-2026-10-01.json) qualifies 18 distinct
patch opportunities, 43 ambiguous small/crowded observations and 17 apparent gaps.

The first ten opportunities now have independently reviewed **candidate visible
surfaces**: Mini Split, Smooth Business, Cube, $600, Angel Dyno, Around the World,
Barndoor, Black Warm-up North, Black Warm-up South and Bubble Butt. Dashed partial
surface patches are a separate layer from source points. Every candidate has
`spatialConfidence`, `visibleBoundaryConfidence` and
`sourceAssociationConfidence` set to `low`; the supported public confidence
values are `high`, `medium` and `low`. Named physical identities remain
unresolved and complete bases unobserved. Nearby Split/Around the World and
Bubble Butt/Timepiece records are not merged. This acceptance permits tentative
surface geometry before field verification; it does not accept full footprints.
Fresh rendered context/legend/obstruction review passes. The mobile disclosure
now scrolls within a bounded panel with its summary and close control visible.
The [fresh independent candidate receipt](source-data/geo-candidate-surface-review-2026-10-01.json)
also verifies exact transfer from author-native pixels to committed inputs and
runtime vectors, retaining distinct catalog IDs and the unchanged raster hash.

## Rebuild inputs and offline assets

`docs/kraft-gauntlet/source-data/geo-provenance.json` records exact requests,
response extents, raster identity, failed requests and SHA-256 checksums.
Deliberate rebuild inputs are the merged `geo-osm-source.json`, original
`geo-osm-source-2026-09-30.json`, native `geo-osm-west-source.xml`, peak source and
`geo-dem-source.tif`. Native candidate vertices are retained in
`geo-surface-candidates-2026-10-01.json`, with the unchanged lawful
`geo-naip-expanded-reference.jpg` committed alongside it. Its native raster
hash, dimensions and reported EPSG:3857 extent are checked before projection;
the builder does not smooth or stretch the candidate geometry. The shipped map
does not fetch aerial imagery.

Run `scripts/build-kraft-geography.py` with Python containing numpy and Pillow.
The established raster/contour builder makes no network calls and derives its
world/bounds from provenance. Runtime `public/kraft/geo-features.json` is imported
statically, offered under ODbL, and remains available offline. Independent USGS
contributions remain public domain. Separate
`public/kraft/geo-surface-candidates.json` contains the partial surface vectors
and uncertainty dimensions; it is statically imported and available offline.
`public/kraft/geo-license.txt` preserves the
attributions. A final offline manifest rebuild is required when the runtime
geographic asset changes.
