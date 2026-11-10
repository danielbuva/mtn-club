import {
  PAGE_EDITORS,
  type PageEditAccess,
  resolveSitePage,
  withReturnTo,
} from '@/lib/admin/site-pages'

export type BarContent = {
  name: string
  /** Shown as a tag beside the page name. */
  status?: string
  action?: { label: string; href: string }
  note?: string
}

const NO_ACCESS = 'Your role can’t edit this page.'

export function barContent(
  pathname: string,
  isEditing: boolean,
  access: PageEditAccess,
  ledTripIds: readonly string[] = [],
): BarContent | null {
  const current = resolveSitePage(pathname)
  if (!current) return null

  if (current.kind === 'trip') {
    const leadsTrip =
      access.trips === 'assigned' && ledTripIds.includes(current.tripId)
    if (access.trips === 'assigned' && !leadsTrip)
      return {
        name: 'Trip page',
        note: 'You don’t lead this trip, so you can’t edit it.',
      }
    if (access.trips !== 'edit' && !leadsTrip)
      return { name: 'Trip page', note: NO_ACCESS }
    if (isEditing) return { name: 'Trip page', status: 'Editing' }
    return {
      name: 'Trip page',
      action: {
        label: 'Edit this trip',
        href: `/trips/${current.tripId}?edit=1`,
      },
    }
  }

  if (current.kind === 'notice') {
    if (access.notices !== 'edit') return { name: 'Notice', note: NO_ACCESS }
    return {
      name: 'Notice',
      action: {
        label: 'Edit this notice',
        href: withReturnTo(
          `/admin/announcements/by-slug/${encodeURIComponent(current.slug)}`,
          pathname,
        ),
      },
    }
  }

  const { page } = current
  if (!page.editor)
    return {
      name: page.name,
      note: 'Written in code. Ask the web maintainer to change it.',
    }
  const level = access[page.editor]
  if (level === 'none' || level === 'view')
    return { name: page.name, note: NO_ACCESS }
  const editor = PAGE_EDITORS[page.editor]
  return {
    name: page.name,
    action: { label: editor.action, href: withReturnTo(editor.href, pathname) },
  }
}
