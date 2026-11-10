import { ChevronRightIcon } from 'lucide-react'
import type { GuideSection } from '@/app/(reader)/guides/types'

export function GuideContents({
  sections,
  activeId,
  expandedIds,
  onSectionClick,
  onToggle,
  onJump,
}: {
  sections: GuideSection[]
  activeId: string
  expandedIds: string[]
  onSectionClick: (section: GuideSection) => void
  onToggle: (id: string) => void
  onJump: (id: string) => void
}) {
  return (
    <nav aria-label="Guide contents">
      <ol className="border-t border-border">
        {sections.map((section, index) => (
          <li key={section.id} className="border-b border-border">
            <div className="grid grid-cols-[minmax(0,1fr)_44px] items-start">
              <button
                type="button"
                aria-current={activeId === section.id ? 'location' : undefined}
                onClick={() => onSectionClick(section)}
                className={`flex min-h-11 min-w-0 flex-1 items-start gap-2 py-3 text-left text-sm leading-snug focus-visible:outline-2 focus-visible:outline-offset-2 ${activeId === section.id ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-1.5 shrink-0 ${activeId === section.id ? 'bg-foreground' : ''}`}
                />
                <span
                  aria-hidden="true"
                  className="shrink-0 font-brand text-[13px] tabular-nums"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{section.tocLabel ?? section.title}</span>
              </button>
              {section.subsections?.length ? (
                <button
                  type="button"
                  aria-label={`${expandedIds.includes(section.id) ? 'Collapse' : 'Expand'} ${section.tocLabel ?? section.title}`}
                  aria-expanded={expandedIds.includes(section.id)}
                  onClick={() => onToggle(section.id)}
                  className="flex min-h-11 min-w-11 items-center justify-center text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <ChevronRightIcon
                    aria-hidden="true"
                    className={`size-4 ${expandedIds.includes(section.id) ? 'rotate-90' : ''}`}
                  />
                </button>
              ) : null}
            </div>
            {expandedIds.includes(section.id) && section.subsections?.length ? (
              <ul className="ml-5 border-l border-border pl-3">
                {section.subsections.map(subsection => (
                  <li key={subsection.id}>
                    <button
                      type="button"
                      onClick={() => onJump(subsection.id)}
                      className="block min-h-11 w-full py-2 text-left text-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {subsection.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}
