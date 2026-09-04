import {
  BarChart3,
  CalendarDays,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Users,
} from 'lucide-react'
export const adminNavigationIcons = {
  Overview: LayoutDashboard,
  Trips: CalendarDays,
  Membership: ShieldCheck,
  Accounts: Users,
  Analytics: BarChart3,
  'Mailing List': Mail,
  Gallery: GalleryHorizontalEnd,
  'Leadership & Access': UserRoundCog,
  Settings,
} as const
