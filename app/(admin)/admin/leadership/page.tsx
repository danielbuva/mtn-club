import { ChevronDown, UserRoundCheck } from 'lucide-react'
import { Suspense } from 'react'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import {
  roleCardClass,
  roleSummaryClass,
  rosterCardClass,
  rosterLabelClass,
} from '@/components/admin/leadership-styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveRosterEntryAction, setRoleCapabilityAction } from './actions'

async function AdminLeadershipPageContent() {
  const context = await requireAdminCapability('leadership.read')
  const admin = createAdminClient()
  const [roles, capabilities, grants, hosts, authUsers] = await Promise.all([
    admin.from('admin_roles').select('*').order('name'),
    admin
      .from('admin_capabilities')
      .select('*')
      .eq('phase', 1)
      .eq('is_active', true)
      .order('resource')
      .order('action'),
    admin.from('admin_role_grants').select('*'),
    admin
      .from('club_hosts')
      .select('*')
      .order('display_order')
      .order('public_name'),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])
  const queryError = [roles, capabilities, grants, hosts].find(
    result => result.error,
  )?.error
  if (queryError) throw queryError
  if (authUsers.error) throw authUsers.error
  const grantMap = new Map(
    (grants.data ?? []).map(grant => [
      `${grant.role_id}:${grant.capability_key}`,
      grant.scope,
    ]),
  )

  return (
    <>
      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-brand text-3xl uppercase">Active roster</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Public names stay separate from accounts until an officer signs
              up.
            </p>
          </div>
        </div>
        <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
          {(hosts.data ?? []).map(host => (
            <details key={host.id} className={roleCardClass}>
              <summary className={roleSummaryClass}>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {host.public_name}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {host.club_title}
                    {host.is_active ? '' : ' · Inactive'}
                  </span>
                </span>
                <ChevronDown
                  className="ml-3 size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <form action={saveRosterEntryAction} className={rosterCardClass}>
                <input type="hidden" name="hostId" value={host.id} />
                <label
                  htmlFor={`host-name-${host.id}`}
                  className={rosterLabelClass}
                >
                  Public name
                  <Input
                    id={`host-name-${host.id}`}
                    name="publicName"
                    defaultValue={host.public_name}
                    className="mt-1"
                    required
                  />
                </label>
                <label
                  htmlFor={`host-title-${host.id}`}
                  className={rosterLabelClass}
                >
                  Title
                  <Input
                    id={`host-title-${host.id}`}
                    name="title"
                    defaultValue={host.club_title}
                    className="mt-1"
                    required
                  />
                </label>
                <label
                  htmlFor={`host-role-${host.id}`}
                  className={rosterLabelClass}
                >
                  Role
                  <select
                    id={`host-role-${host.id}`}
                    name="roleKey"
                    defaultValue={host.role_key ?? ''}
                    className="mt-1 h-10 w-full border border-input bg-background px-3 text-sm"
                  >
                    {(roles.data ?? [])
                      .filter(role => !role.is_super_admin)
                      .map(role => (
                        <option key={role.id} value={role.key}>
                          {role.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label
                  htmlFor={`host-order-${host.id}`}
                  className={rosterLabelClass}
                >
                  Display order
                  <Input
                    id={`host-order-${host.id}`}
                    name="displayOrder"
                    type="number"
                    min={0}
                    defaultValue={host.display_order}
                    className="mt-1"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide sm:col-span-2">
                  Linked account
                  <select
                    name="linkedUserId"
                    defaultValue={host.linked_user_id ?? ''}
                    className="mt-1 h-10 w-full border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Not linked</option>
                    {(authUsers.data.users ?? []).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.email ?? user.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={host.is_active}
                  />{' '}
                  Show on public roster
                </label>
                {context.isSuperAdmin ? (
                  <Button type="submit" size="sm">
                    Save roster entry
                  </Button>
                ) : null}
              </form>
            </details>
          ))}
          {context.isSuperAdmin ? (
            <details className={roleCardClass}>
              <summary className={roleSummaryClass}>
                <span className="font-semibold">Add leader</span>
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <form
                action={saveRosterEntryAction}
                className="grid gap-3 border border-dashed border-[#211D18]/25 p-5 sm:grid-cols-2"
              >
                <input
                  name="publicName"
                  placeholder="New leader name"
                  aria-label="New leader name"
                  required
                  className="h-10 border border-input bg-background px-3 text-sm"
                />
                <input
                  name="title"
                  placeholder="Public title"
                  aria-label="Public title"
                  required
                  className="h-10 border border-input bg-background px-3 text-sm"
                />
                <select
                  name="roleKey"
                  className="h-10 border border-input bg-background px-3 text-sm"
                  aria-label="Role"
                >
                  {(roles.data ?? [])
                    .filter(role => !role.is_super_admin)
                    .map(role => (
                      <option key={role.id} value={role.key}>
                        {role.name}
                      </option>
                    ))}
                </select>
                <Input
                  name="displayOrder"
                  type="number"
                  min={0}
                  defaultValue={100}
                  aria-label="Display order"
                />
                <select
                  name="linkedUserId"
                  className="h-10 border border-input bg-background px-3 text-sm"
                  aria-label="Linked account"
                >
                  <option value="">Not linked</option>
                  {(authUsers.data.users ?? []).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email ?? user.id}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked /> Show
                  publicly
                </label>
                <Button size="sm" className="sm:col-span-2">
                  <UserRoundCheck className="size-4" /> Add leader
                </Button>
              </form>
            </details>
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-brand text-3xl uppercase">Role permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Multiple roles combine; the most permissive scope wins. Protected
          super-admin powers are not delegable here.
        </p>
        <div className="mt-5 space-y-5">
          {(roles.data ?? [])
            .filter(role => !role.is_super_admin)
            .map(role => (
              <details key={role.id} className={roleCardClass}>
                <summary className={roleSummaryClass}>
                  <h3 className="font-semibold">{role.name}</h3>
                  <span className="flex items-center gap-3">
                    <Badge variant="outline">{role.key}</Badge>
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="grid divide-y divide-border">
                  {(capabilities.data ?? []).map(capability => {
                    const current =
                      grantMap.get(`${role.id}:${capability.key}`) ?? 'none'
                    return (
                      <form
                        key={capability.key}
                        action={setRoleCapabilityAction}
                        className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[1fr_10rem_auto]"
                      >
                        <input type="hidden" name="roleId" value={role.id} />
                        <input
                          type="hidden"
                          name="capabilityKey"
                          value={capability.key}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {capability.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {capability.key}
                          </p>
                        </div>
                        <select
                          name="scope"
                          defaultValue={current}
                          disabled={!context.isSuperAdmin}
                          className="h-9 border border-input bg-background px-3 text-sm"
                        >
                          <option value="none">No access</option>
                          {capability.supports_assigned_scope ? (
                            <option value="assigned">Assigned only</option>
                          ) : null}
                          <option value="all">All</option>
                        </select>
                        {context.isSuperAdmin ? (
                          <Button size="sm" variant="outline">
                            Save
                          </Button>
                        ) : null}
                      </form>
                    )
                  })}
                </div>
              </details>
            ))}
        </div>
      </section>
    </>
  )
}

export default function AdminLeadershipPage() {
  return (
    <AdminViewFrame view="leadership">
      <Suspense fallback={<AdminPanelFallback view="leadership" />}>
        <AdminLeadershipPageContent />
      </Suspense>
    </AdminViewFrame>
  )
}
