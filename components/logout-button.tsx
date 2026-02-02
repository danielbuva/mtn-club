import { signOutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit">Logout</Button>
    </form>
  )
}
