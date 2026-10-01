# Kraft geography workbench

The guide map uses real geographic observations, rendered as an editorial field
map. There is no live basemap request. The static layer contains 98 features:
39 trail segments, 18 public road/track segments, 5 intermittent wash segments,
1 parking polygon and 35 elevation contours. Private road observations are
excluded. No route between a boulder and a trail has been invented.

## Coordinate contract

`lib/kraft/geography.ts` exports a north-up **1000 × 800** world. WGS84 bounds are
west **−115.4233**, east **−115.4093**, south **36.1562**, north **36.16525**.
`projectLocation({ lat, lon })` uses EPSG:3857 and returns `{ x, y }`;
`unprojectLocation({ x, y })` reverses it. North is y=0. The envelope covers
approximately 1,258 × 1,008 metres on the ground. `worldUnitsForMeters(100)`
provides the scale bar length, approximately 79.48 world units. Latitude scale
variation across this small envelope is under 0.02%; x/y aspect distortion is
under 0.1%.

`geographicFeatures` exposes `id`, `kind`, `name`, `points`, `closed`, `sourceId`,
`sourceUrl`, `status`, `informal`, `intermittent`, `elevation` and `major`.
`kind` is `trail | wash | parking | road | contour`.
`mapPath(points, closed)` generates SVG line geometry. Contours use metres of
elevation, at 20 m intervals with major lines every 40 m. A closed contour means
the derived contour ring closed; it does not mark a rock outline or lithology.
The Kraft Mountain label uses OSM peak node 7112921633, observed at
36.1641215, −115.4215676 with recorded elevation 1,437 m.

## Geographic evidence

| Layer | Source | Redistribution | Qualification |
| --- | --- | --- | --- |
| Trail, road, wash, parking and peak | [OpenStreetMap](https://www.openstreetmap.org/copyright), queried through Overpass | ODbL 1.0; credit and derivative database provided | Community observations, not a field survey; informal paths retain their status |
| Contours | [USGS 3DEP](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer) bare earth elevation export | US public domain, credited | 500 × 400 raw F32 samples across this envelope, roughly 2.52 m sampling; contour interpolation is derived geometry |
| Terrain reference | [USGS/USDA NAIP](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer), locked source raster 134873 | US public domain, credited | June 11, 2022 USDA-FSA-APFO imagery; 0.6 m nominal source resolution, exported at 1600 × 1280 |
| Boulder observations | Four exact parent boulder records documented by the content ledger | Small factual observations; no proprietary map artwork copied | These locations have not been field verified; contradictory route GPS has been retained as a disagreement rather than used to move a boulder |

OSM ways were projected and clipped to the envelope. Douglas–Peucker
simplification stays within 0.5 world units (about 0.63 m) of those observations.
USGS contours are linearly interpolated with marching squares, joined at shared
cell edges, then simplified using the same tolerance. These processing bounds
are not estimates of the source data's actual surveying accuracy.

The OSM polygon for Kraft Mountain Parking Area is way 255587420. Mapped streams
are drawn as **intermittent washes**, without implying flowing water. There is
no source-backed name “Kraft Wash” in this data. A sandstone terrain tint may be
generalized from the NAIP image for visual legibility; it is an editorial tint,
not a measured geological boundary. Boulder glyphs are symbols located at the
catalog observations, not surveyed silhouettes.

## Retained assets and reproducibility

`public/kraft/geo-features.json` is the 144 KB runtime vector layer. It is imported
statically into the guide JavaScript and works without fetching a remote map.
The geographic database is offered under ODbL 1.0; the independent USGS
contributions remain public domain. `geo-license.txt` provides downloadable
credit and license links. `docs/kraft-gauntlet/source-data/geo-provenance.json` records exact requests, returned
projection extents, source observations and SHA-256 checksums.

`docs/kraft-gauntlet/source-data/` retains `geo-osm-source.json`,
`geo-osm-peaks-source.json` and `geo-dem-source.tif` as deliberate rebuild inputs.
They do not inflate the field download. The raw NAIP review image is local scratch
at `.tmp/kraft-gauntlet/references/geo-naip-reference.jpg`; its exact source request,
raster identity, size and original checksum remain in the provenance record so it
can be reacquired for footprint review. The shipped application does not depend
on that scratch reference.

To regenerate vectors from the committed evidence, run
`scripts/build-kraft-geography.py` with Python containing numpy and Pillow.
It makes no network calls. The bundled Codex Python runtime satisfies those
requirements. Regeneration yields the same 98 features and 5,201 simplified
points; all x/y coordinates have been checked as finite and within the map.

This existing narrow Python tool is retained because Pillow decodes the raw F32
GeoTIFF directly and numpy supplies the established elevation grid pipeline.
Rewriting a stable raster decoder and contour rebuild solely for language
uniformity adds no product benefit. New acquisition, reconciliation, coordinate
and manifest tooling should use TypeScript where practical. The Python script is
a regeneration utility, not a required application runtime or a scratch export.

## Remaining geographic gaps

- Field verification and independent boulder GPS survey are still missing.
- Photographic silhouettes and a physical identification survey for the pilot
  rocks are missing. The map must retain the “approximate symbols” explanation.
- OSM observations are contextual paths, not a verified approach network for
  each boulder. A GPS field walk is needed before claiming turn-by-turn routes.
- The overview envelope deliberately covers the pilot rocks, parking and
  southern Kraft Mountain. It does not cover the entire Kraft Mountain loop.

These are retained source-backed pilot observations with explicit uncertainties.
The current full-Kraft placement and footprint audit must reassess this layer;
no surveyed or complete Kraft field-map acceptance is claimed.
