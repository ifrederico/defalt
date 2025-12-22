import { STORAGE_KEYS } from '../constants.js'

export const CSRF_COOKIE_NAME = 'defalt.csrf'
export const CSRF_HEADER_NAME = 'x-csrf-token'
export const CSRF_ENDPOINT = '/api/auth/csrf'
export const CSRF_TOKEN_STORAGE_KEY = STORAGE_KEYS.CSRF_TOKEN
