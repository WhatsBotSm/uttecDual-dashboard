import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from '../lib/api'
import type { Usuario } from '../lib/types'

interface AuthValue {
  usuario: Usuario | null
  cargando: boolean
  entrar: (usuario: string, password: string) => Promise<void>
  registrar: (datos: Record<string, unknown>) => Promise<void>
  salir: () => void
  refrescar: () => Promise<void>
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

interface LoginResp {
  token: string
  usuario: Usuario
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(!!getToken())

  const refrescar = useCallback(async () => {
    setUsuario(await api.get<Usuario>('/auth/me'))
  }, [])

  useEffect(() => {
    if (!getToken()) return
    refrescar()
      .catch(() => setToken(null))
      .finally(() => setCargando(false))
  }, [refrescar])

  useEffect(() => {
    const alExpirar = () => setUsuario(null)
    window.addEventListener('uttecdual:sesion-expirada', alExpirar)
    return () => window.removeEventListener('uttecdual:sesion-expirada', alExpirar)
  }, [])

  const aplicar = (r: LoginResp) => {
    setToken(r.token)
    setUsuario(r.usuario)
  }

  const value: AuthValue = {
    usuario,
    cargando,
    refrescar,
    entrar: async (u, p) => aplicar(await api.post<LoginResp>('/auth/login', { usuario: u, password: p })),
    registrar: async (datos) => aplicar(await api.post<LoginResp>('/auth/registro', datos)),
    salir: () => {
      setToken(null)
      setUsuario(null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
