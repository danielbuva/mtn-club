import { Switch } from '@/components/ui/switch'
import { ProfileSection } from '@/components/profile/profile-section'
import type { NotificationSettings } from '@/lib/profile/types'

interface NotificationsProps {
  value: NotificationSettings
  onChange: <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => void
}

export function NotificationsSection({ value, onChange }: NotificationsProps) {
  return (
    <ProfileSection
      title="Notifications"
      description="Pick how you want to hear about updates."
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Email updates</p>
          <p className="text-xs text-muted-foreground">Trip announcements and changes.</p>
        </div>
        <Switch
          checked={value.email}
          onCheckedChange={(checked) => onChange('email', checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">SMS alerts</p>
          <p className="text-xs text-muted-foreground">Time-sensitive reminders.</p>
        </div>
        <Switch
          checked={value.sms}
          onCheckedChange={(checked) => onChange('sms', checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Club announcements</p>
          <p className="text-xs text-muted-foreground">News and community updates.</p>
        </div>
        <Switch
          checked={value.announcements}
          onCheckedChange={(checked) => onChange('announcements', checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Trip updates</p>
          <p className="text-xs text-muted-foreground">New trips and schedule changes.</p>
        </div>
        <Switch
          checked={value.tripUpdates}
          onCheckedChange={(checked) => onChange('tripUpdates', checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Member stories</p>
          <p className="text-xs text-muted-foreground">Community highlights.</p>
        </div>
        <Switch
          checked={value.memberStories}
          onCheckedChange={(checked) => onChange('memberStories', checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Safety alerts</p>
          <p className="text-xs text-muted-foreground">Urgent trip notifications.</p>
        </div>
        <Switch
          checked={value.safetyAlerts}
          onCheckedChange={(checked) => onChange('safetyAlerts', checked)}
        />
      </div>
    </ProfileSection>
  )
}
