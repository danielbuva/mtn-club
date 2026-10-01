# Current UI / field-use review

Reviewed production `http://localhost:3130/guide/kraft`, edition `2026-10-01-workbench-2`, on 2026-10-01. Fresh artifact-first review; no prior critique or builder explanation informed the verdict. Screenshots are temporary under `/tmp/kraft-current-ui-review/` and `/tmp/kraft-current-ui-review-keyboard/`.

**Verdict: the current layout is usable as a content pilot, but the finished field-guide bar fails.** The largest gap is visible content: four boulders, 58 climbs, ten face choices, only one photograph, and no reviewed route overlays. Three boulders cannot show their rock; Pearl SE shows the rock but cannot identify a selected line. The interface honestly labels this limitation rather than presenting a comprehensive guide.

## Observed working

- Actual pixels inspected at 320×568, 390×664, 320×844, 390×844, and 1440×1000. The Pearl opens directly onto the full photograph, with the rock, ground/start region, and topout visible. Short screens reduce the photograph without cropping it; pinch zoom remains available. Desktop gives the image the primary column and climbs the adjacent column. No horizontal dialog overflow was observed.
- All ten face controls were tapped normally. Compact face controls and collapsed **Finding the boulder** keep the presentation ahead of metadata. All nine missing-photo views explicitly say a licensed, identified photograph is needed and that route lines are unavailable.
- Every current route was inspected: Cube 12, Split 9, Pearl 11, Monkey Bar 26. All 58 rows were selectable without forced clicks at 320×568. Each full record and nested source section opened and closed normally; scrolling reached the last source link for all 58, and return to the climb list worked. Ordinary touch swipes separately reached Monkey Bar’s first/last climbs and Darwin Award’s last source entry, then returned to the list.
- Lists retain the complete boulder roster across faces and progress through grade bands from easiest to hardest. Known face assignments switch the face with selection; manually choosing another face clears an incompatible selection. Face-pending and same-name identity warnings are visible. Darwin Award’s physical-rock uncertainty and Northeast Face Left’s conflicting identity/grades are reachable in full details.
- Long selected titles, including **Monkey Bar Direct Right** and **Phazed (a.k.a. The Hole)**, remain readable. Short-phone **Details** opens and focuses the inline record summary; full factual and provisional-identity content remains reachable.
- Pearl was inspected both unselected and through a climb deep link. Actual two-finger pinch, drag, and reset preserved the selected climb and restored the original full framing. No line coordination can be accepted while overlays are absent.
- Keyboard Tab/Enter opens list entries and activates faces/climbs. Nested details and source links have visible focus. Escape from a normally opened list entry restores its opener.

## Current navigation follow-up

The original edition-2 direct-link close-to-BODY finding is resolved in edition
`2026-10-01-workbench-3`. A separate fresh navigation critic inspected actual
keyboard interaction at 320×568, 390×844 and 1440×1000. Cold boulder/face/climb
links focus the boulder heading; Escape and Back to Kraft return cold entries to
the Kraft title. Normal map/list/search entries restore the exact original SVG
or HTML opener, including after nearby-boulder navigation. Face and climb
activation retains control focus; nearby navigation focuses the new heading
and resets dialog scroll. All full records and sources remain reachable.

Two P3 findings remain: the empty SVG overlay group announces nonexistent route
interaction, and a selected Details shortcut can scroll above the short-screen
long-list viewport. The full-details summary remains reachable below the list.
These observations do not approve full content, map accuracy or route geometry.

Full facts are reachable, although returning from long records shares the climb sidebar’s scroll path; there is no dedicated **Back to climbs** action in this edition.

Source correctness, physical-face accuracy, geographic placement, and offline resilience require their separate gates. This UI review does not accept those domains or full Kraft coverage. Browser inspection has finished and all review browser sessions are closed; rebuilding is safe.
