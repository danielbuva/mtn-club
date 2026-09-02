const requirePublicUrl = (name: string, value: string | undefined) => {
  const candidate = value?.trim()

  if (!candidate) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required public link: ${name}`)
    }
    return ''
  }

  const url = new URL(candidate)
  if (url.protocol !== 'https:') {
    throw new Error(`${name} must use HTTPS`)
  }

  return url.toString()
}

export const DISCORD_INVITE_URL = requirePublicUrl(
  'NEXT_PUBLIC_DISCORD_INVITE_URL',
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL,
)

export const INSTAGRAM_URL = requirePublicUrl(
  'NEXT_PUBLIC_INSTAGRAM_URL',
  process.env.NEXT_PUBLIC_INSTAGRAM_URL,
)

export const INVOLVEMENT_CENTER_URL =
  'https://involvementcenter.unlv.edu/organization/unlvmountainclub'

export const CLUB_EMAIL = 'unlvmountainclub@gmail.com'

export const ZELLE_PHONE_DISPLAY = '(702) 217-9376'
export const ZELLE_PHONE_VALUE = '7022179376'
