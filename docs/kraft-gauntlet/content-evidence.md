# Kraft baseline content and evidence

Catalog snapshot: September 30, 2026. Additional source checks: October 1, 2026.
Guide version: `2026-10-01-pilot-5`.
This retained baseline ledger describes the previous four-boulder records; it
does not claim full Kraft coverage or field verification. Full source acquisition
and reconciliation continue in the [live inventory](kraft-content-inventory.csv)
and [source reconciliation](kraft-source-reconciliation.md). Baseline counts below
must not be treated as the expanded guide's current acceptance scope.

## Catalog coverage and missing climbing assets

The guide includes four real boulders and all **58 routes listed on their dated
Mountain Project parent tables**. This covers those four source catalogs; it does
not establish a complete Kraft inventory. All 58 records have original factual synopses from their individual route pages,
in addition to names, linked identities, grades and explicit source risk labels.
These are published observations, not field-verified movement instructions.
Four entries have unresolved physical membership in the named parent boulder.

| Boulder | Dated source route count | Included | Existing researched views |
| --- | --- | --- | --- |
| [The Cube](https://www.mountainproject.com/area/105959355/the-cube) | 12 | 12 | West; south arête; north |
| [Split Boulder](https://www.mountainproject.com/area/105959392/the-split-boulder) | 9 | 9 | North/uphill; south/downhill |
| [The Pearl](https://www.mountainproject.com/area/106056258/the-pearl) | 11 | 11 | Southeast; northeast |
| [Monkey Bar Boulder](https://www.mountainproject.com/area/105937674/monkey-bar-boulder) | 26 | 26 | Provisional cave/roof; northwest; northeast |

The ten face/view records include nine source-backed surfaces and one editorial
provisional Monkey cave/roof grouping. There is **one available licensed Pearl
context photograph, zero field-reviewed photographs and zero authored paths**.
Forty-one routes have no assigned face; fourteen have source-backed assignments
and three have provisional cave/roof assignments. It is not yet a complete
illustrated field guide.

The factual table snapshot is
`source-data/kraft-pilot-catalog-facts.json`. Per-boulder `*-catalog.ts` files retain
literal published V and Font grades, range bounds, route URLs and R/PG13 labels.
No Font conversion is generated. All individual pages were read for terse
original factual synopses. Source-backed assignments use evidenced existing surfaces;
Perfect Poser now has a north-face record backed by Total Devastation’s location
text. One licensed context photograph is available; no paths were reconstructed.
`coverage.status='source-catalog'` means the included count equals this dated
source table. `betaStatus='source-synopsis'` identifies original source-based
writing; it does not mean complete, locally reviewed climbing beta.

Selected Mountain Project V observations govern filters. Range filters intersect
both bounds, including V2-3, V3-4, V4-5, V9-10 and V10-11. Plus/minus modifiers
remain displayed; the numeric filter uses the stated base V number. R and PG13
remain source observations. A low V grade does not remove fall consequences.

Publication checks require the selected V label to match an attached,
source-linked V observation at `selectedGradeSourceId` and its numeric bounds.
Linked comparison opinions cannot silently replace the selected primary grade.
All required assignment/evidence enums reject missing or invalid runtime values. An
unresolved same-name comparison cannot supply the selected grade. Boulder area
assignments must also retain an explicit source-backed or provisional qualifier.
A `field-guide` release label additionally requires every route’s physical
membership, beta and face review metadata, reviewed legal photographs and
authored geometry for each assigned face. An edition-label change alone fails.
Field-guide release also requires field-verified climb status and a selected
field-verified GPS observation, with named review, date and measured uncertainty.
Changing only the plotted coordinate's status does not satisfy that GPS contract.
The current release remains `content-pilot`.

## Repository and attachment inventory

The repository `AGENTS.md`, `README.md` and supplied `goal-objective.md` were read
before researching. The objective attachment folder contained only that Markdown
file. Initial searches found no Kraft guide data, identified face collection,
authored topo SVG or georeferenced boulder inventory.

`public/club-covers/bouldering.jpg` and general gallery descriptors do not establish
the pictured boulder, face, route identity or photo rights for a downloadable
book. They are not used. No Mountain Project, KAYA, theTopo, guidebook, blog or
video-thumbnail photographs were downloaded or embedded. The Pearl’s BLM image
was supplied locally by the user; Commons/Flickr are its documented rights sources.

## Location provenance and rejected observations

| Boulder | Selected latitude, longitude | Selected source |
| --- | --- | --- |
| The Cube | 36.15974, -115.41913 | `mp-cube` parent boulder |
| Split Boulder | 36.15993, -115.41713 | `mp-split` parent boulder |
| The Pearl | 36.15924, -115.41487 | `mp-pearl` parent boulder |
| Monkey Bar Boulder | 36.16154, -115.41099 | `mp-monkey` parent boulder |

Every coordinate is `source-observation`, never `field-verified`. Decimal precision
does not establish accuracy. Symbols do not claim surveyed rock outlines,
dimensions, rotations or extents. Each boulder now stores structured
`location.observations`, with source ID, latitude/longitude, selected/rejected/
comparison status and an explicit selection reason. Only the selected parent
source appears in the plotted location's `sourceIds`; rejected and nearby points
are retained separately, without averaging.

| Observation | Published coordinate | Treatment and reason |
| --- | --- | --- |
| [Perfect Poser](https://www.mountainproject.com/route/105959433/perfect-poser) | 36.09296, -115.3238 | Rejected: outside Kraft and inconsistent with Cube parent. |
| [Front Side Crack](https://www.mountainproject.com/route/106617793/front-side-crack) | 45.64115, -111.00098 | Rejected: Montana, inconsistent with Split parent. |
| [Plumber's Crack](https://www.mountainproject.com/route/107185645/plumbers-crack) | 36.15675, -115.42212 | Rejected: inconsistent with Split parent. |
| [Monkey Bars](https://www.mountainproject.com/route/106657521/monkey-bars) | 36.15044, -115.41981 | Rejected: about 1.47 km from parent; exact route identity/location needs review. |
| [Monkey Crack](https://www.mountainproject.com/route/107849034/monkey-crack) | 36.15693, -115.42073 | Rejected: differs from parent despite its southeast-side prose. Preserve the discrepancy without correction. |
| Monkey Bars page's outbound onX fragment | 36.16154, -115.41099 | Comparison: fragment `#15/36.16154/-115.41099/0/60` repeats the parent, not an independent field measurement. |
| [theTopo Plumber's Crack boulder](https://thetopo.com/crags/kraft-wash-red-rock/topos/plumber-s-crack) | 36.159949, -115.417154 | Comparison: nearby candidate boulder identity; no merge or correction inferred. |
| [theTopo Monkey Bar](https://thetopo.com/crags/kraft-wash-red-rock/topos/monkey-bar-boulder) | 36.161478, -115.410975 | Comparison: separate nearby publisher observation, not a survey. |

The Pearl Area coordinate, 36.15939, -115.41474, represents an area rather than
the physical boulder and is not substituted. The [BLM Kraft trail map](https://www.blm.gov/sites/blm.gov/files/documents/26.Kraft%20Boulders%2027.Kraft%20Mountain%20Loop.pdf)
(March 14, 2018) names Kraft Mountain, Calico Basin, Sandstone Drive, parking and
Kraft trails. It does not establish individual boulder positions or footprints.
No stream is named “Kraft Wash” merely from a legacy theTopo URL slug.

## Face assignments and authored-line boundary

| Assignment | Exact route evidence |
| --- | --- |
| Cube north → Perfect Poser | [Total Devastation’s north-face descent attribution](https://www.mountainproject.com/route/111470042/total-devastation); Cube parent also names it as a downclimb. |
| Cube west → West Face Left | [West face, north edge](https://www.mountainproject.com/route/107004813/west-face-left) |
| Cube south arête → Fear of a Black Hat + A Clockwork Orange | [South side](https://www.mountainproject.com/route/107004045/fear-of-a-black-hat) |
| Split north/uphill → Front Side Crack + The Mole + Slice N Dice | [North side](https://www.mountainproject.com/route/106617793/front-side-crack); parent distinguishes north chimney/south offwidth. |
| Split south/downhill → Plumber's Crack | [South/downhill](https://www.mountainproject.com/route/107185645/plumbers-crack) |
| Pearl southeast → The Pearl + Pearl Necklace | [Southeast face](https://www.mountainproject.com/route/106056281/the-pearl) |
| Pearl northeast → Northeast Face Center | [Middle of northeast face](https://www.mountainproject.com/route/110224533/northeast-face-center) |
| Monkey cave/roof → Monkey Bars + Hyperglide | [Cave/arête](https://www.mountainproject.com/route/106657521/monkey-bars); [shared start, left exit](https://www.mountainproject.com/route/107074342/hyperglide). Editorial provisional shared view. |
| Monkey cave/roof → Monkey Bar Direct | [Uphill roof](https://www.mountainproject.com/route/107378329/monkey-bar-direct). Exact shared photographed view unresolved. |
| Monkey northwest → Monkey Bar Right + Monkey Bar Direct Right | [Northwest side](https://www.mountainproject.com/route/106683440/monkey-bar-right) |
| Monkey northeast → Northeast Face Left | [Left of northeast face](https://www.mountainproject.com/route/113880181/northeast-face-left) |

`Face.groupingStatus` and `Climb.faceAssignmentStatus` distinguish source-backed,
editorial-provisional and unassigned records. The cave/roof group has unknown
cardinal orientation and no reviewed photographic boundaries; prose does not
establish that all three routes fit one view. Publication validation refuses
authored geometry on that provisional grouping.

Split Decision, Six Pack and Jenna's Jewelry remain unassigned. Their route
text does not resolve the exact photographic view: respectively relative position
beside a crack, north side without a reviewed northeast-view match, and a corner
without cardinal direction. Perfect Poser’s north surface is now recorded from
cross-route evidence, while starting holds and exact line remain unreviewed. Thirty-eight of the newly researched routes also retain no face assignment.
Five source-backed additions use existing surfaces: A Clockwork Orange’s explicit
south side; The Mole and Slice N Dice’s uphill side; Pearl Necklace’s lower start
into The Pearl; and Monkey Bar Direct Right’s explicit northwest side. Source
links remain on each route. No surface is inferred from a name or parent table.

The additional assignment sources are [A Clockwork Orange](https://www.mountainproject.com/route/107004798/a-clockwork-orange),
[The Mole](https://www.mountainproject.com/route/116385877/the-mole),
[Slice N Dice](https://www.mountainproject.com/route/107974932/slice-n-dice),
[Pearl Necklace](https://www.mountainproject.com/route/107444907/pearl-necklace), and
[Monkey Bar Direct Right](https://www.mountainproject.com/route/112381021/monkey-bar-direct-right).

Monkey Bars' arête movement is an original source-supported synopsis; there is no
cross-face line, target-face link or continuation mapping. Route geometry must be
locally authored against a licensed exact photograph, using native image pixel
coordinates and a `width × height` viewBox. Chalk, plausible holds, competitor
artwork or generated paths are not used to reconstruct a route.

## Grade comparisons and route identity

Every grade observation includes its source ID, literal source name and
`identityStatus`. A same-name other-publisher observation is `unresolved` until
physical starts, variants and finishes are reviewed. These are possible grade
or identity disagreements, not asserted consensus or confirmed route matches.

| Record | Published observations | Treatment |
| --- | --- | --- |
| Plumber's Crack | [MP](https://www.mountainproject.com/route/107185645/plumbers-crack): V2 / YDS 5.9, R. [KAYA individual route](https://kaya-app.kayaclimb.com/climb/Plumbers-Crack-v1-Red-Rocks-121118): V1, chimney without cardinal face. | KAYA identity unresolved; do not assert it is the south offwidth. MP south remains selected; north Front Side Crack remains V0 / 5.8 R. |
| Jenna's Jewelry | [MP](https://www.mountainproject.com/route/106652010/jennas-jewelry): V3-4. [KAYA public list](https://kaya-app.kayaclimb.com/location/Kraft-Boulders-331388): V4. | KAYA same-name identity unresolved; keep MP range 3–4 for filters. |
| Split Decision | MP parent table: V1 / Font 5. theTopo candidate Split boulder: Font 6B. | theTopo line/variant identity unresolved; retain both observations and MP V1 filtering. |

All five original Monkey route comparisons are now structured and visible, with
Mountain Project linked to each exact route record and [theTopo's public index](https://thetopo.com/crags/kraft-wash-red-rock/topos/monkey-bar-boulder)
as an unresolved same-name comparison:

| Route | Mountain Project Font | theTopo Font | Identity |
| --- | --- | --- | --- |
| [Monkey Bars](https://www.mountainproject.com/route/106657521/monkey-bars) | 5+ | 6B+ | theTopo unresolved |
| [Hyperglide](https://www.mountainproject.com/route/107074342/hyperglide) | 6C | 6C+ | theTopo unresolved |
| [Monkey Bar Direct](https://www.mountainproject.com/route/107378329/monkey-bar-direct) | 7B | 7B+ | theTopo unresolved |
| [Monkey Bar Right](https://www.mountainproject.com/route/106683440/monkey-bar-right) | 7A | 7A+ | theTopo unresolved |
| [Northeast Face Left](https://www.mountainproject.com/route/113880181/northeast-face-left) | 6A | 6B | theTopo unresolved |

Additional theTopo “Monkey bars left v2”/“Monkey bars right v2” names are not merged
with Monkey Bars. KAYA's “Pearl - Northeast Face Center” V2 remains separate from
MP Northeast Face Center V1; the direct page was not readable during the initial
research and no physical match is asserted.

Structured aliases retain exact source and identity: MP Hyperglide records the
earlier name **Monkey Pinch**; MP Split's table explicitly records **The Hole**
as an alternate name of Phazed. Monkey’s Uncle explicitly identifies **Classic
Monkey** as Monkey Bar Right. These source-linked aliases are searchable.
“Plumber's Crack” as a boulder name comes from the nearby theTopo candidate and
stays an unresolved alias observation, outside Split's canonical search aliases.
Cube and The Split Boulder display aliases retain their parent source IDs.

Descriptions are original terse factual synopses with explicit gaps where the
source omits a start, direction, physical relationship or photographed extent.
No guidebook prose, star ratings or verbatim user comments are imported. Dated
condition/grade opinions are short attributed factual paraphrases. New route
URLs were first obtained from parent tables, then all 43 individual
route pages were consulted. Source notes distinguish original factual writing
from copied prose/media; selected grades continue to cite dated parent tables.

## Additional physical, grade and condition contradictions

The named parent tables are catalog sources, not a reconciled physical inventory.
`boulderAssignmentStatus` is explicitly provisional for these entries, with a
source-linked rationale and no assigned face or invented separate coordinate:

- [Leaning Wide Crack](https://www.mountainproject.com/route/106629920/leaning-wide-crack)
  is listed under Split, but its individual page places it on a separate rock to
  the north, with a north-facing crack.
- [Umpa Lumpa](https://www.mountainproject.com/route/108551582/umpa-lumpa)
  is listed under Monkey, but its page identifies a small standalone rock to the west.
- [Darwin Award](https://www.mountainproject.com/route/107513950/darwin-award)
  finishes on the separate shelter slab; continuing onto Monkey Bar Boulder is
  optional. That catalog association does not establish single-rock membership.
- [Glory Hole](https://www.mountainproject.com/route/107838637/glory-hole)
  uses a tunnel formed by a slab leaning against Monkey. Exact rock/face membership
  in that shelter complex remains unresolved.

Published secondary grade references are retained without pretending the original
book was consulted: MP’s Marriage prose reports a guidebook V5 versus its parent
V6+; MP’s Clam Bumper prose reports Jenson guidebook V4 versus parent V3. Both are
unresolved observations. Phazed’s neighbor reference calls The Mole V5/6; theTopo
candidate index calls it Font 7A versus MP parent Font 7A+. The exact physical
line and grade history remain unresolved. Selected parent grades do not change.

The same theTopo Mole entry has an undated reported break/no subsequent ascent
note. `conditionObservations` preserves publisher, name, identity qualifier and
rationale. This does not establish that the selected MP route is currently broken
or unclimbed. Left’s individual MP description and location also disagree on its
left/right relationship to Left Left; the synopsis preserves that contradiction.

Monkey Bar Direct retains two dated public reports with exact comment anchors:
[Scott B, April 21, 2023](https://www.mountainproject.com/route/107378329/monkey-bar-direct#Comment-124063243)
links post-break beta and proposes approximately V10; [Zachary Radke, March 28,
2024](https://www.mountainproject.com/route/107378329/monkey-bar-direct#Comment-125879656)
discusses the break while retaining V8. Both are attributed source observations.
Neither establishes the break date, affected hold, current condition or consensus.
The selected table remains V8 / Font 7B, and `selectedGradeSourceId` points to the
primary route grade rather than either personal opinion. Split Decision also
retains its source’s jumbled-rock landing concern, without inventing an R rating.

## Geographic assets and legal imagery gap

`public/kraft/geo-features.json` is the shipped map asset. Its inventory record
attributes OpenStreetMap contributors (ODbL 1.0) and USGS National Map 3DEP
(public domain); `public/kraft/geo-license.txt` and geography provenance retain
terms and extraction metadata. OSM trails/parking/washes are community source
observations. Terrain-derived colors and rock symbols do not claim surveyed
boulder outlines. USGS/USDA NAIP aerial imagery is geographic reference, not
an exact boulder-face photograph. These geographic assets do not fill topo gaps.

Public climbing pages do not establish redistribution permission for imagery or
topo artwork. MP's published warning excludes taking others' photos/text without
permission. The available [Pearl BLM photograph](https://commons.wikimedia.org/wiki/File:Interesting_Geology_at_Kraft_Mountain_(54084251954).jpg)
credits Samantha Szesciorka / BLM Nevada. Commons and original BLM Flickr retain
U.S. public-domain and CC BY 2.0 terms. The supplied 3840×2880 file was resized
to 1800×1350 WebP with composition preserved; rights, hashes and view evidence
are in `pearl-photograph.md` and `public/kraft/pearl-photo-license.txt`. The
southeast correlation is source-observed; exact viewpoint and route-to-photo
correspondence remain unreviewed. No northeast assignment or path is inferred.
Southern Nevada Bouldering III remains a reference; no pages are reproduced.

Published assets and their media/open-data sources now declare typed distribution
grants with a primary rights-evidence URL. A compact audited-grant registry binds
the existing CC BY 2.0, U.S. federal public-domain and ODbL records to the exact
publisher/rights URLs and retained review documents. New grants need documented
rights review; arbitrary prose, unrelated URLs and factual-reference sources cannot
authorize shipped pixels. Source identifiers are unique. Dates must be real and
nonfuture; source access cannot follow edition review, and dated grade/condition
reports must agree with source publication dates.
The undated Mole report remains undated. Field status requires named owner review,
selected GPS evidence agreement and measured coordinate uncertainty. Every field
coordinate observation needs its own reviewer/date/uncertainty; selected review
matches plotted review. Neither a provisional physical parent nor a provisional
face group can support a canonical source-backed route-face claim. Test reviews
and lines are clearly labeled synthetic; they add no field evidence to this ledger.

Remaining required climbing assets and review:

1. Original or explicitly licensed clean photographs for Cube west/south/north,
   Split north/south, Pearl northeast, Monkey cave/roof/northwest/
   northeast. Each needs author, exact permission/license, attribution, file,
   dimensions, date, physical identity and camera orientation. A photograph may
   serve multiple records only after knowledgeable review establishes the view.
2. Photo/face review for the 41 unassigned routes, physical membership review for
   the four provisional entries, and local beta review for all 58 source records.
   Additional viewpoints are needed beyond the ten current records; ten photos
   alone would not establish complete topos. The Pearl context image also needs
   physical viewpoint and exact route-correspondence review.
3. Locally authored route paths on the exact licensed photos, with reviewed route
   identity, starts/finishes, overlaps and native-photo pixel coordinates.
4. A reviewed second view and continuation mapping for Monkey Bars' arête move.
5. Field checks for boulder positions, walking approaches, orientations,
   downclimbs, route identities and grade comparisons. None is relabeled verified
   merely because multiple publishers agree.

A complete offline download of the current catalog and map remains a complete
download of limited content. It does not imply complete Kraft coverage, complete licensed
face imagery, topo completion or field validation.
