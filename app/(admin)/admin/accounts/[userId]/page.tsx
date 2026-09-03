import {
  ArrowLeft,
  Ban,
  KeyRound,
  ShieldCheck,
  Trash2,
  UserRoundCog,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  assignLeadershipRoleAction,
  grantMembershipAccessAction,
  permanentlyDeleteAccountAction,
  removeLeadershipRoleAction,
  sendPasswordResetAction,
  setAccountRestrictionAction,
  setSuperAdminAction,
} from '../actions'

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Los_Angeles',
      }).format(new Date(value))
    : '—'

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const context = await requireAdminCapability('accounts.read')
  const { userId } = await params
  const admin = createAdminClient()
  const authUser = await admin.auth.admin.getUserById(userId)
  if (authUser.error || !authUser.data.user) notFound()

  const [
    profile,
    membership,
    restriction,
    assignments,
    roles,
    zellePayments,
    entitlements,
    overrides,
    application,
    mailing,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('memberships').select('*').eq('user_id', userId).maybeSingle(),
    admin
      .from('membership_account_restrictions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('admin_user_roles').select('role_id').eq('user_id', userId),
    admin
      .from('admin_roles')
      .select('id, key, name, is_super_admin')
      .order('name'),
    admin
      .from('membership_zelle_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    admin
      .from('membership_entitlements')
      .select(
        'id, starts_at, ends_at, revoked_at, zelle_payment_id, payment_id',
      )
      .eq('user_id', userId)
      .order('ends_at', { ascending: false }),
    admin
      .from('membership_access_overrides')
      .select('id, starts_at, ends_at, reason, revoked_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    admin
      .from('membership_applications')
      .select('status, guardian_consent, created_at')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('mailing_list_subscriptions')
      .select('subscribed, subscribed_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const queryError = [
    profile,
    membership,
    restriction,
    assignments,
    roles,
    zellePayments,
    entitlements,
    overrides,
    application,
    mailing,
  ].find(result => result.error)?.error
  if (queryError) throw queryError

  const user = authUser.data.user
  const assignedIds = new Set(
    (assignments.data ?? []).map(item => item.role_id),
  )
  const assignedRoles = (roles.data ?? []).filter(role =>
    assignedIds.has(role.id),
  )
  const assignableRoles = (roles.data ?? []).filter(
    role => !role.is_super_admin && !assignedIds.has(role.id),
  )
  const isTargetSuperAdmin = assignedRoles.some(role => role.is_super_admin)

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
      <Link
        href="/admin/accounts"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
      >
        <ArrowLeft className="size-4" /> Accounts
      </Link>
      <AdminPageHeader
        title={profile.data?.display_name ?? 'Account'}
        description={user.email ?? 'Pseudonymized deleted identity'}
        actions={
          <div className="flex gap-2">
            <Badge variant="secondary">
              {membership.data?.status ?? 'no membership'}
            </Badge>
            {restriction.data?.restriction &&
            restriction.data.restriction !== 'normal' ? (
              <Badge variant="destructive">
                {restriction.data.restriction}
              </Badge>
            ) : null}
            {isTargetSuperAdmin ? <Badge>Super Admin</Badge> : null}
          </div>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
          <h2 className="font-brand text-2xl uppercase">Account access</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last sign in</dt>
              <dd className="font-medium">
                {formatDate(user.last_sign_in_at ?? null)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Application</dt>
              <dd className="font-medium">
                {application.data?.status ?? 'none'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mailing list</dt>
              <dd className="font-medium">
                {mailing.data?.subscribed
                  ? `Subscribed ${formatDate(mailing.data.subscribed_at)}`
                  : 'Not subscribed'}
              </dd>
            </div>
          </dl>
          {context.permissions['accounts.update'] && user.email ? (
            <div className="mt-6 grid gap-3 border-t border-border pt-5">
              <form action={sendPasswordResetAction}>
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="email" value={user.email} />
                <Button size="sm" variant="outline">
                  <KeyRound className="size-4" /> Send password reset
                </Button>
              </form>
              <form
                action={setAccountRestrictionAction}
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input type="hidden" name="userId" value={userId} />
                <select
                  name="restriction"
                  defaultValue={restriction.data?.restriction ?? 'normal'}
                  className="h-10 border border-input bg-background px-3 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
                <Input
                  name="reason"
                  maxLength={500}
                  placeholder="Reason"
                  aria-label="Restriction reason"
                />
                <Button size="sm" variant="outline">
                  <Ban className="size-4" /> Update
                </Button>
              </form>
            </div>
          ) : null}
        </section>

        <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
          <h2 className="font-brand text-2xl uppercase">Leadership roles</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {assignedRoles.length ? (
              assignedRoles.map(role => (
                <div
                  key={role.id}
                  className="flex items-center gap-1 rounded-full bg-secondary pl-3 text-sm font-semibold"
                >
                  <span>{role.name}</span>
                  {context.isSuperAdmin && !role.is_super_admin ? (
                    <form action={removeLeadershipRoleAction}>
                      <input type="hidden" name="userId" value={userId} />
                      <input type="hidden" name="roleId" value={role.id} />
                      <button
                        type="submit"
                        className="rounded-full px-2 py-1.5 hover:bg-destructive/10"
                        aria-label={`Remove ${role.name}`}
                      >
                        ×
                      </button>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No leadership roles assigned.
              </p>
            )}
          </div>
          {context.isSuperAdmin && assignableRoles.length ? (
            <form
              action={assignLeadershipRoleAction}
              className="mt-5 flex gap-2 border-t border-border pt-5"
            >
              <input type="hidden" name="userId" value={userId} />
              <select
                name="roleId"
                className="h-10 flex-1 border border-input bg-background px-3 text-sm"
              >
                {assignableRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <Button size="sm">
                <UserRoundCog className="size-4" /> Assign
              </Button>
            </form>
          ) : null}
          {context.isSuperAdmin ? (
            <form
              action={setSuperAdminAction}
              className="mt-5 border-t border-border pt-5"
            >
              <input type="hidden" name="userId" value={userId} />
              <input
                type="hidden"
                name="operation"
                value={isTargetSuperAdmin ? 'remove' : 'assign'}
              />
              <Button
                size="sm"
                variant={isTargetSuperAdmin ? 'destructive' : 'outline'}
                disabled={isTargetSuperAdmin && userId === context.userId}
              >
                <ShieldCheck className="size-4" />
                {isTargetSuperAdmin ? 'Remove Super Admin' : 'Make Super Admin'}
              </Button>
              {isTargetSuperAdmin && userId === context.userId ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  You cannot remove your own super-admin access.
                </p>
              ) : null}
            </form>
          ) : null}
        </section>

        <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
          <h2 className="font-brand text-2xl uppercase">Membership history</h2>
          <div className="mt-4 space-y-3 text-sm">
            {(entitlements.data ?? []).map(item => (
              <div key={item.id} className="bg-secondary/60 p-3">
                <p className="font-semibold">Payment-backed term</p>
                <p className="text-muted-foreground">
                  {formatDate(item.starts_at)} – {formatDate(item.ends_at)}
                  {item.revoked_at ? ' · revoked' : ''}
                </p>
              </div>
            ))}
            {(overrides.data ?? []).map(item => (
              <div key={item.id} className="bg-secondary/60 p-3">
                <p className="font-semibold">Complimentary access</p>
                <p className="text-muted-foreground">
                  {item.reason} · {formatDate(item.ends_at)}
                </p>
              </div>
            ))}
            {!(entitlements.data ?? []).length &&
            !(overrides.data ?? []).length ? (
              <p className="text-muted-foreground">No access history.</p>
            ) : null}
          </div>
          {context.permissions['membership.update'] ? (
            <form
              action={grantMembershipAccessAction}
              className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-[7rem_1fr_auto]"
            >
              <input type="hidden" name="userId" value={userId} />
              <div>
                <Label htmlFor="days">Days</Label>
                <Input
                  id="days"
                  name="days"
                  type="number"
                  min={1}
                  max={730}
                  defaultValue={365}
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  name="reason"
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Document why access is granted"
                />
              </div>
              <Button className="self-end" size="sm">
                <ShieldCheck className="size-4" /> Grant
              </Button>
            </form>
          ) : null}
        </section>

        <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
          <h2 className="font-brand text-2xl uppercase">Zelle payments</h2>
          <div className="mt-4 space-y-3 text-sm">
            {(zellePayments.data ?? []).length ? (
              (zellePayments.data ?? []).map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 bg-secondary/60 p-3"
                >
                  <div>
                    <p className="font-semibold capitalize">{payment.status}</p>
                    <p className="text-muted-foreground">
                      {formatDate(payment.claimed_at)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {(payment.amount_cents / 100).toLocaleString('en-US', {
                      style: 'currency',
                      currency: payment.currency,
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No Zelle payment records.</p>
            )}
          </div>
        </section>
      </div>

      {context.isSuperAdmin && !isTargetSuperAdmin && user.email ? (
        <section className="mt-6 border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="font-brand text-2xl uppercase text-destructive">
            Danger zone
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Permanently remove the login and scrub personal information while
            retaining pseudonymized club history. Type the email exactly to
            confirm.
          </p>
          <form
            action={permanentlyDeleteAccountAction}
            className="mt-5 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <input type="hidden" name="userId" value={userId} />
            <Input
              name="confirmation"
              type="email"
              required
              placeholder={user.email}
              aria-label="Type account email to confirm deletion"
            />
            <Button variant="destructive">
              <Trash2 className="size-4" /> Permanently delete
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  )
}
