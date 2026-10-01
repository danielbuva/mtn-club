'use client'

import { ArrowLeft, LocateFixed, Mountain } from 'lucide-react'
import { searchGuide } from '@/lib/kraft/search'
import type { KraftGuide as KraftGuideData } from '@/lib/kraft/types'
import { BoulderResults } from './boulder-results'
import { GuideDialog } from './guide-dialog'
import { GuideNotes } from './guide-notes'
import { GuideSearch } from './guide-search'
import { KraftMap } from './kraft-map'
import { OfflineDownload } from './offline-download'
import { useGuideLocation } from './use-guide-location'
import { useGuideState } from './use-guide-state'

export function KraftGuide({ guide }: { guide: KraftGuideData }) {
  const { state, update } = useGuideState()
  const view = state.view
  const location = useGuideLocation()
  const results = searchGuide(guide, state)
  const boulder = guide.boulders.find(item => item.id === state.boulderId)
  const climbCount = results.reduce(
    (total, result) => total + result.climbs.length,
    0,
  )

  function selectBoulder(id: string, climbId?: string) {
    const chosenClimb = climbId ?? null
    const rock = guide.boulders.find(item => item.id === id)
    const faceId =
      rock?.climbs.find(item => item.id === chosenClimb)?.faceIds[0] ??
      rock?.faces[0]?.id ??
      null
    update({ boulderId: id, climbId: chosenClimb ?? null, faceId }, true)
  }

  return (
    <div
      className="kraft-guide"
      data-editorial-surface
      data-overscroll-tone="paper"
    >
      <header className="kraft-site-header">
        <a href="/" className="kraft-brand">
          <Mountain size={20} aria-hidden="true" />
          <span>MTN Club</span>
        </a>
        <span className="kraft-series">Field notes / No. 01</span>
        <a href="/welcome" className="kraft-club-link">
          <ArrowLeft size={14} aria-hidden="true" /> The club
        </a>
      </header>
      <main>
        <section className="kraft-masthead" aria-labelledby="kraft-title">
          <div>
            <p className="kraft-eyebrow">Red Rock · Southern Nevada</p>
            <h1 id="kraft-title" tabIndex={-1}>
              Kraft <span>Boulders</span>
            </h1>
          </div>
          <div className="kraft-edition">
            <p>A little closer to the rock.</p>
            <span>
              {guide.boulders.length} rock catalogs ·{' '}
              {guide.boulders.reduce(
                (total, rock) => total + rock.climbs.length,
                0,
              )}{' '}
              climb records ·{' '}
              {guide.status === 'catalog' ? 'Source catalogs' : 'Content pilot'}
            </span>
          </div>
        </section>
        <GuideSearch
          filters={state}
          areas={guide.areas}
          onChange={patch =>
            update({
              ...patch,
              ...(patch.query !== undefined
                ? { view: patch.query.trim() ? 'list' : 'map' }
                : {}),
            })
          }
        />
        <section className="kraft-explorer" aria-label="Explore Kraft Boulders">
          <div className="kraft-explorer-bar">
            <fieldset className="kraft-view-switch">
              <legend className="sr-only">Guide view</legend>
              <button
                type="button"
                aria-pressed={view === 'map'}
                onClick={() => update({ view: 'map' })}
              >
                Map
              </button>
              <button
                type="button"
                aria-pressed={view === 'list'}
                onClick={() => update({ view: 'list' })}
              >
                Boulders <span>{results.length}</span>
              </button>
            </fieldset>
            <button
              type="button"
              className="kraft-locate"
              onClick={location.locate}
              disabled={location.locating}
            >
              <LocateFixed size={16} aria-hidden="true" />
              {location.locating ? 'Locating…' : 'Locate me'}
            </button>
          </div>
          <output className="kraft-location-status">{location.message}</output>
          <div className={`kraft-explorer-grid kraft-view-${view}`}>
            <div className="kraft-map-frame">
              <KraftMap
                boulders={guide.boulders}
                selectedBoulderId={state.boulderId}
                visibleBoulderIds={results.map(result => result.boulder.id)}
                matchingClimbCounts={Object.fromEntries(
                  results.map(result => [
                    result.boulder.id,
                    result.climbs.length,
                  ]),
                )}
                filtersActive={Boolean(
                  state.query.trim() || state.grade !== 'all' || state.areaId,
                )}
                onBoulderSelect={selectBoulder}
                location={location.position}
              />
            </div>
            <aside className="kraft-directory" aria-label="Boulder directory">
              <div className="kraft-directory-heading">
                <h2>Choose your rock.</h2>
                <p>
                  {results.length} rock catalogs · {climbCount} matching guide
                  records
                </p>
              </div>
              <BoulderResults
                results={results}
                areas={guide.areas}
                query={state.query}
                onSelect={selectBoulder}
                onReset={() => update({ query: '', grade: 'all', areaId: '' })}
              />
              <p className="kraft-directory-note">
                Tap a rock on the map or choose one here. Source locations are
                approximate; photo topos are still being documented.
              </p>
            </aside>
          </div>
        </section>
        <section className="kraft-field-kit" aria-label="Offline field kit">
          <div>
            <p className="kraft-eyebrow">Before you head out</p>
            <h2>Take this edition with you.</h2>
            <p>
              The map, climb records and available media, saved on this device.
            </p>
          </div>
          <OfflineDownload guide={guide} />
        </section>
        <GuideNotes guide={guide} />
      </main>
      <footer className="kraft-footer">
        <span className="kraft-brand">UNLV Mountain Club</span>
        <span>Leave it better than you found it.</span>
      </footer>
      <GuideDialog
        guide={guide}
        boulder={boulder}
        climbId={state.climbId}
        faceId={state.faceId}
        onSelectFace={(faceId, climbId) => update({ faceId, climbId }, true)}
        onSelectClimb={id => {
          const climb = boulder?.climbs.find(item => item.id === id)
          const faceId = climb?.faceIds.includes(state.faceId ?? '')
            ? state.faceId
            : (climb?.faceIds[0] ?? state.faceId)
          update({ climbId: id, faceId }, true)
        }}
        onClose={() =>
          update({ boulderId: null, climbId: null, faceId: null }, true)
        }
        onSelectBoulder={selectBoulder}
      />
    </div>
  )
}
