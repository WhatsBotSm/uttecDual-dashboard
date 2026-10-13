// Cliente de la API REST de UTTEC-DUAL.
// Base de la API: por defecto '/api' (en desarrollo lo reenvía el proxy de Vite; en producción, el servidor web).
// Si la API vive en otro origen, define VITE_API_BASE (ej. https://api.uttecamac.edu.mx/api).
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '/api'
const TOKEN_KEY = 'uttecdual.token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* respuesta sin cuerpo */
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? `Error ${res.status}`
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      setToken(null)
      window.dispatchEvent(new Event('uttecdual:sesion-expirada'))
    }
    throw new ApiError(res.status, msg)
  }
  return data as T
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {}),
  put: <T>(p: string, b?: unknown) => request<T>('PUT', p, b ?? {}),
  del: <T>(p: string) => request<T>('DELETE', p),
}

export const mensajeError = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado')
