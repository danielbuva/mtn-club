export const AUTH_CACHE_TAG = 'auth'

export const authUserTag = (userId: string) => `${AUTH_CACHE_TAG}:${userId}`
