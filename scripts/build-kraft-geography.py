"""Rebuild the Kraft vector layer from the committed OSM and USGS observations.

Requires Pillow and numpy. No network calls. Coordinates are Web Mercator,
north-up. The provenance supplies the envelope and output-world dimensions.
"""

import json
import hashlib
import math
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PROVENANCE = json.loads((ROOT / "docs/kraft-gauntlet/source-data/geo-provenance.json").read_text())
BOUNDS = PROVENANCE["boundsWgs84"]
WEST, SOUTH, EAST, NORTH = (BOUNDS[key] for key in ["west", "south", "east", "north"])
WIDTH, HEIGHT = (PROVENANCE["world"][key] for key in ["width", "height"])
RADIUS = 6378137


def mercator(lon, lat):
    return (RADIUS * math.radians(lon),
            RADIUS * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))


LEFT, BOTTOM = mercator(WEST, SOUTH)
RIGHT, TOP = mercator(EAST, NORTH)


def project(lon, lat):
    x, y = mercator(lon, lat)
    return project_mercator(x, y)


def project_mercator(x, y):
    return ((x - LEFT) / (RIGHT - LEFT) * WIDTH,
            (TOP - y) / (TOP - BOTTOM) * HEIGHT)


def clip_segment(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    enter, leave = 0, 1
    for p, q in [(-dx, a[0]), (dx, WIDTH - a[0]),
                 (-dy, a[1]), (dy, HEIGHT - a[1])]:
        if p == 0:
            if q < 0:
                return None
            continue
        ratio = q / p
        if p < 0:
            enter = max(enter, ratio)
        else:
            leave = min(leave, ratio)
        if enter > leave:
            return None
    return ((a[0] + enter * dx, a[1] + enter * dy),
            (a[0] + leave * dx, a[1] + leave * dy))


def clip_line(points):
    paths, current = [], []
    for a, b in zip(points, points[1:]):
        segment = clip_segment(a, b)
        if segment is None:
            if current:
                paths.append(current)
                current = []
            continue
        a, b = segment
        if current and math.dist(current[-1], a) > 0.001:
            paths.append(current)
            current = []
        if not current:
            current.append(a)
        current.append(b)
    if current:
        paths.append(current)
    return paths


def simplify(points, tolerance=0.5):
    """Douglas–Peucker: retain source line within 0.5 world units (~0.63 m)."""
    if len(points) < 3:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    length2 = dx * dx + dy * dy
    furthest, index = 0, 0
    for i, p in enumerate(points[1:-1], 1):
        ratio = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2)) if length2 else 0
        distance = math.dist(p, (a[0] + ratio * dx, a[1] + ratio * dy))
        if distance > furthest:
            furthest, index = distance, i
    if furthest > tolerance:
        return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)
    return [a, b]


def serialized_points(points):
    return [{"x": round(x, 2), "y": round(y, 2)} for x, y in points]


def osm_features():
    data = json.loads((ROOT / "docs/kraft-gauntlet/source-data/geo-osm-source.json").read_text())
    features = []
    for element in data["elements"]:
        tags = element.get("tags", {})
        if not element.get("geometry") or tags.get("access") == "private":
            continue
        if tags.get("amenity") == "parking":
            kind = "parking"
        elif tags.get("waterway"):
            kind = "wash"
        elif tags.get("highway") in ["path", "footway", "steps"]:
            kind = "trail"
        else:
            kind = "road"
        points = [project(p["lon"], p["lat"]) for p in element["geometry"]]
        for part, path in enumerate(clip_line(points)):
            if sum(math.dist(a, b) for a, b in zip(path, path[1:])) < 3:
                continue
            features.append({
                "id": f"osm-{element['id']}-{part}", "kind": kind,
                "name": tags.get("name", "Intermittent wash" if kind == "wash" else "Mapped path"),
                "points": serialized_points(simplify(path)),
                "closed": kind == "parking" and math.dist(path[0], path[-1]) < 0.01,
                "sourceId": element.get("sourceId", PROVENANCE["osm"]["id"]),
                "sourceUrl": f"https://www.openstreetmap.org/way/{element['id']}",
                "informal": tags.get("informal") == "yes", "elevation": None,
                "intermittent": tags.get("intermittent") == "yes",
                "major": False,
            })
    return features


def contour_features():
    """Marching squares over raw F32 elevation, then join shared cell edges."""
    grid = np.asarray(Image.open(ROOT / "docs/kraft-gauntlet/source-data/geo-dem-source.tif"))
    rows, cols = grid.shape
    extent = PROVENANCE["usgs3dep"]["export"]["response"]["extent"]

    def grid_point(col, row):
        return project_mercator(
            extent["xmin"] + col / cols * (extent["xmax"] - extent["xmin"]),
            extent["ymax"] - row / rows * (extent["ymax"] - extent["ymin"]),
        )

    result = []
    for elevation in range(1120, 1440, 20):
        segments = []
        for row in range(rows - 1):
            for col in range(cols - 1):
                values = [grid[row, col], grid[row, col + 1],
                          grid[row + 1, col + 1], grid[row + 1, col]]
                above = [float(value) >= elevation for value in values]
                if all(above) or not any(above):
                    continue
                corners = [(col + 0.5, row + 0.5), (col + 1.5, row + 0.5),
                           (col + 1.5, row + 1.5), (col + 0.5, row + 1.5)]
                crossings = []
                for edge in range(4):
                    end = (edge + 1) % 4
                    if above[edge] == above[end]:
                        continue
                    ratio = (elevation - float(values[edge])) / (float(values[end]) - float(values[edge]))
                    a, b = corners[edge], corners[end]
                    projected = grid_point(a[0] + ratio * (b[0] - a[0]),
                                           a[1] + ratio * (b[1] - a[1]))
                    crossings.append((edge, tuple(round(value, 5) for value in projected)))
                if len(crossings) == 2:
                    segments.append((crossings[0][1], crossings[1][1]))
                elif len(crossings) == 4:
                    # Bilinear centre disambiguates saddle cells without smoothing.
                    if (sum(map(float, values)) / 4 >= elevation) == above[0]:
                        pairs = [(0, 1), (2, 3)]
                    else:
                        pairs = [(0, 3), (1, 2)]
                    segments.extend((crossings[a][1], crossings[b][1]) for a, b in pairs)
        adjacency = defaultdict(list)
        for i, (a, b) in enumerate(segments):
            adjacency[a].append(i)
            adjacency[b].append(i)
        remaining = set(range(len(segments)))
        while remaining:
            segment_id = min(remaining)
            first, second = segments[segment_id]
            remaining.remove(segment_id)
            path = [first, second]
            for extend_front in [False, True]:
                endpoint = path[0] if extend_front else path[-1]
                while True:
                    neighbors = [i for i in adjacency[endpoint] if i in remaining]
                    if not neighbors:
                        break
                    i = neighbors[0]
                    remaining.remove(i)
                    a, b = segments[i]
                    endpoint = b if endpoint == a else a
                    if extend_front:
                        path.insert(0, endpoint)
                    else:
                        path.append(endpoint)
            if len(path) < 8:
                continue
            result.append({
                "id": f"usgs-contour-{elevation}-{len(result)}", "kind": "contour",
                "name": f"{elevation} m", "points": serialized_points(simplify(path)),
                "closed": math.dist(path[0], path[-1]) < 0.01,
                "sourceId": PROVENANCE["usgs3dep"]["id"],
                "sourceUrl": "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer",
                "informal": False, "elevation": elevation, "intermittent": False,
                "major": elevation % 40 == 0,
            })
    return result


def build_surface_candidates():
    """Project partial visible surfaces from their native NAIP pixel edges."""
    source = json.loads((ROOT / "docs/kraft-gauntlet/source-data/geo-surface-candidates-2026-10-01.json").read_text())
    reference = source["reference"]
    raster_path = ROOT / reference["path"]
    if hashlib.sha256(raster_path.read_bytes()).hexdigest() != reference["sha256"]:
        raise ValueError("NAIP candidate reference hash changed")
    with Image.open(raster_path) as raster:
        if raster.size != (reference["width"], reference["height"]):
            raise ValueError("NAIP candidate reference dimensions changed")
    extent = reference["extentEpsg3857"]
    candidates = []
    for candidate in source["candidates"]:
        if candidate["geometryScope"] != "candidate-visible-surface" or candidate["physicalIdentity"] != "unresolved" or candidate["baseBoundary"] != "unobserved":
            raise ValueError("Candidate cannot assert a physical identity or base")
        for key in ["spatialConfidence", "visibleBoundaryConfidence", "sourceAssociationConfidence"]:
            if candidate[key] not in ["high", "medium", "low"]:
                raise ValueError(f"Unsupported confidence: {candidate[key]}")
        points = [project_mercator(
            extent["xmin"] + pixel["x"] / reference["width"] * (extent["xmax"] - extent["xmin"]),
            extent["ymax"] - pixel["y"] / reference["height"] * (extent["ymax"] - extent["ymin"]),
        ) for pixel in candidate["imagePixels"]]
        candidates.append({key: value for key, value in candidate.items() if key != "imagePixels"} | {
            "points": serialized_points(points), "closed": True,
            "sourceId": reference["sourceId"], "sourceUrl": reference["sourceUrl"],
            "rasterId": reference["rasterId"], "acquisitionDate": reference["acquisitionDate"],
            "status": "candidate",
        })
    payload = {"world": {"width": WIDTH, "height": HEIGHT}, "boundsWgs84": BOUNDS,
               "geometryScope": source["geometryScope"], "completePhysicalFootprintsAccepted": 0,
               "sourceId": reference["sourceId"], "candidates": candidates}
    (ROOT / "public/kraft/geo-surface-candidates.json").write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    print(f"Built {len(candidates)} partial visible-surface candidates")


if __name__ == "__main__":
    features = osm_features() + contour_features()
    payload = {"world": {"width": WIDTH, "height": HEIGHT},
               "boundsWgs84": BOUNDS, "features": features}
    (ROOT / "public/kraft/geo-features.json").write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    print(f"Built {len(features)} source-observation features")
    build_surface_candidates()
