const LS_KEY = 'VITE_REDIRECT_BASE_URL'

export function getRedirectBaseUrl() {
  try {
    const fromLs = localStorage.getItem(LS_KEY)
    if (fromLs && fromLs.trim()) return fromLs.trim().replace(/\/+$/, '')
  } catch {
    /* ignore */
  }
  const fromEnv = import.meta.env.VITE_REDIRECT_BASE_URL
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim().replace(/\/+$/, '')
  return ''
}

export function setSessionRedirectBaseUrl(url) {
  try {
    localStorage.setItem(LS_KEY, String(url || '').trim())
  } catch {
    /* ignore */
  }
}
