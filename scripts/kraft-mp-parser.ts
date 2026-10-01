import type { Page } from '@playwright/test'
import type {
  GradeObservation,
  LinkRecord,
  ParsedGrades,
  ParsedPage,
} from './kraft-mp-schema.ts'

export async function parseMpPage(
  page: Page,
  html: string,
): Promise<ParsedPage> {
  return page.evaluate((source): ParsedPage => {
    const document = new DOMParser().parseFromString(source, 'text/html')
    const text = (node: Element | null): string =>
      node?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    const grades = (container: Element): ParsedGrades => {
      const observations = [
        ...container.querySelectorAll('span[class]'),
      ].flatMap((element): GradeObservation[] => {
        const sourceClass = [...element.classList].find(value =>
          value.startsWith('rate'),
        )
        if (!sourceClass) return []
        const sourceLabel = text(element.querySelector('a'))
        const literal = element.cloneNode(true)
        if (!(literal instanceof Element)) return []
        literal.querySelectorAll('a').forEach(label => label.remove())
        const grade = text(literal)
        // Mountain Project uses rateYDS for both YDS and literal V grades.
        const system =
          sourceClass === 'rateYDS' && /^V/.test(grade)
            ? 'V'
            : sourceClass.slice('rate'.length)
        return [
          { system, grade, sourceClass, sourceLabel, text: text(element) },
        ]
      })
      const value = (system: string): string =>
        observations.find(observation => observation.system === system)
          ?.grade ?? ''
      const fullText = text(container)
      return {
        text: fullText,
        v: value('V'),
        yds: value('YDS'),
        font: value('Font'),
        risk: fullText.match(/\b(PG13|R|X)\b/)?.[1] ?? '',
        observations,
      }
    }
    const link = (element: Element): LinkRecord | null => {
      const url = element.getAttribute('href') ?? ''
      const id = url.match(/\/(?:area|route)\/(\d+)/)?.[1]
      return id ? { id, url, name: text(element) } : null
    }
    const coordinateRow = [
      ...document.querySelectorAll('table.description-details tr'),
    ].find(row => text(row.querySelector('td')) === 'GPS:')
    const coordinateText = text(
      coordinateRow?.querySelector('td:nth-child(2)') ?? null,
    )
    const coordinateMatch = coordinateText.match(
      /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/,
    )
    const typeRow = [
      ...document.querySelectorAll('table.description-details tr'),
    ].find(row => text(row.querySelector('td')) === 'Type:')
    const totalMatch = [...document.querySelectorAll('h2')]
      .map(text)
      .find(value => /^\d+ Total Climbs$/.test(value))
      ?.match(/^\d+/)
    const heading = document.querySelector('h1')
    heading?.querySelectorAll('a, span').forEach(element => element.remove())
    const children = [
      ...document.querySelectorAll(".lef-nav-row > a[href*='/area/']"),
    ]
      .map(link)
      .filter((value): value is LinkRecord => value !== null)
    const gradeHeading = document.querySelector('h2.inline-block.mr-2')
    const routeListings = [
      ...document.querySelectorAll('#left-nav-route-table tr'),
    ].flatMap(row => {
      const route = row.querySelector("a[href*='/route/']")
      if (!route) return []
      const record = link(route)
      if (!record) return []
      const grade = row.querySelector('.route-type')
      const routeTypes =
        grade?.className
          .split(' ')
          .filter(value => value !== 'route-type' && value !== '') ?? []
      const order = row.getAttribute('data-lr')
      const parsedGrades = grade ? grades(grade) : null
      return [
        {
          ...record,
          gradeText: parsedGrades?.text ?? '',
          vGrade: parsedGrades?.v ?? '',
          ydsGrade: parsedGrades?.yds ?? '',
          fontGrade: parsedGrades?.font ?? '',
          gradeObservations: parsedGrades?.observations ?? [],
          risk: parsedGrades?.risk ?? '',
          routeTypes,
          sourceOrderLeftToRight: order !== null ? Number(order) : null,
        },
      ]
    })
    const breadcrumb = [
      ...document.querySelectorAll(
        ".mb-half.small.text-warm > a[href*='/area/']",
      ),
    ]
      .map(link)
      .filter((value): value is LinkRecord => value !== null)
    const sections = [...document.querySelectorAll('.fr-view')].map(
      element => ({
        heading: text(element.previousElementSibling),
        characterCount: text(element).length,
        noUsefulText: text(element).startsWith('No text - use'),
      }),
    )
    const commentMatch = [...document.querySelectorAll('h2.comment-count')]
      .map(text)
      .join()
      .match(/\d+/)
    const photoReferences = [
      ...new Set(
        [...document.querySelectorAll("a[href*='/photo/']")].map(
          element => element.getAttribute('href') ?? '',
        ),
      ),
    ]
    return {
      name: text(heading),
      coordinates: coordinateMatch
        ? {
            latitude: Number(coordinateMatch[1]),
            longitude: Number(coordinateMatch[2]),
          }
        : null,
      typeText: typeRow ? text(typeRow.querySelector('td:nth-child(2)')) : null,
      grades: gradeHeading ? grades(gradeHeading) : null,
      declaredTotal: totalMatch ? Number(totalMatch[0]) : null,
      children,
      routeListings,
      breadcrumb,
      sections,
      photoReferences,
      commentCount: commentMatch ? Number(commentMatch[0]) : null,
    }
  }, html)
}

/** Authored selector regression; source HTML stays in ignored research scratch. */
export async function verifyMpGradeParsing(page: Page): Promise<void> {
  const spans = `<span class="rateYDS">5.8 <a>YDS</a></span>
    <span class="rateYDS">V0-1 <a>YDS</a></span>
    <span class="rateFont">4+ <a>Font</a></span>`
  const parsed = await parseMpPage(
    page,
    `<h1>Authored grade regression</h1>
      <h2 class="inline-block mr-2">${spans} R</h2>
      <table id="left-nav-route-table"><tr><td>
        <a href="https://www.mountainproject.com/route/1/authored">Authored</a>
        <span class="route-type Boulder">${spans} R</span>
      </td></tr></table>`,
  )
  const detail = parsed.grades
  const listing = parsed.routeListings[0]
  if (
    detail?.v !== 'V0-1' ||
    detail.yds !== '5.8' ||
    detail.font !== '4+' ||
    detail.risk !== 'R' ||
    detail.text !== '5.8 YDS V0-1 YDS 4+ Font R' ||
    detail.observations.length !== 3 ||
    detail.observations[1].sourceLabel !== 'YDS' ||
    listing?.vGrade !== 'V0-1' ||
    listing.ydsGrade !== '5.8' ||
    listing.gradeObservations.length !== 3
  )
    throw new Error('Literal mixed-grade selector regression failed')
}
