'use client'

// Development-only calibration fixture; never part of the Kraft content library.
import { useState } from 'react'
import type { Climb, Face, GuideAsset } from '@/lib/kraft/types'
import { ClimbDetail } from './climb-detail'
import { FaceViewer } from './face-viewer'

const asset: GuideAsset = {
  id: 'test-grid',
  src: '/guide/assets/topo-test-grid.svg',
  kind: 'face-photo',
  license: 'Original synthetic test fixture',
  attribution: 'MTN Club software calibration fixture',
  sourceIds: ['test-fixture'],
}
const faces: Face[] = ['test-front', 'test-side'].map((id, index) => ({
  id,
  name: `Calibration view ${index + 1}`,
  orientation: 'Test only',
  orientationStatus: 'unknown',
  image: {
    status: 'available',
    src: asset.src,
    width: 1000,
    height: 750,
    alt: 'Synthetic calibration grid, not a climbing photograph.',
    assetId: asset.id,
  },
  climbIds: ['test-route-a', 'test-route-b'],
  sourceIds: ['test-fixture'],
}))
const climbs: Climb[] = ['test-route-a', 'test-route-b'].map((id, index) => ({
  id,
  name: `Fixture route ${index === 0 ? 'A' : 'B'}`,
  grade: 'Test',
  gradeValue: 0,
  gradeObservations: [],
  status: 'source-observation',
  description:
    'Synthetic paths verify selection, overlap, wrapping and native-image alignment. This is not real climbing information.',
  faceIds: faces.map(face => face.id),
  sourceIds: ['test-fixture'],
  geometry: faces.map((face, faceIndex) => ({
    status: 'authored',
    faceId: face.id,
    path:
      index === 0
        ? 'M260 640 C290 460 550 460 560 330 C570 230 690 160 690 85'
        : 'M750 640 C680 475 560 490 560 330 C555 195 390 170 360 85',
    labelPoint: { x: index === 0 ? 260 : 750, y: 640 },
    sourceIds: ['test-fixture'],
    reviewedAt: '2026-09-30',
    ...(faceIndex === 0 && index === 0
      ? {
          continuation: {
            faceId: 'test-side',
            description: 'Calibration continuation onto view 2.',
          },
        }
      : {}),
  })),
}))

export function TopoTestFixture() {
  const [faceId, setFaceId] = useState('test-front')
  const [climbId, setClimbId] = useState('test-route-a')
  const face = faces.find(item => item.id === faceId) ?? faces[0]
  const climb = climbs.find(item => item.id === climbId) ?? climbs[0]
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="font-brand text-3xl uppercase">
        SVG renderer calibration
      </h1>
      <p className="my-4">
        Development-only synthetic fixture. Not a Kraft boulder, photograph or
        route.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {faces.map(item => (
          <button
            key={item.id}
            type="button"
            aria-pressed={faceId === item.id}
            className="min-h-11 border px-3"
            onClick={() => setFaceId(item.id)}
          >
            {item.name}
          </button>
        ))}
        {climbs.map(item => (
          <button
            key={item.id}
            type="button"
            aria-pressed={climbId === item.id}
            className="min-h-11 border px-3"
            onClick={() => setClimbId(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <FaceViewer
        key={face.id}
        face={face}
        asset={asset}
        climbs={climbs}
        selectedClimbId={climbId}
        onClimbSelect={setClimbId}
      />
      <ClimbDetail
        climb={climb}
        number={climbs.indexOf(climb) + 1}
        face={face}
        faces={faces}
        sources={[]}
        onFaceSelect={setFaceId}
      />
    </main>
  )
}
