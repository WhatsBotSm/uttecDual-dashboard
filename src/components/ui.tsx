import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { mensajeError } from '../lib/api'

export const inputCls = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500'

export function Campo({ label, children, ayuda }: { label: string; children: ReactNode; ayuda?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {ayuda && <p className="mt-1 text-xs text-slate-500">{ayuda}</p>}
    </div>
  )
}

export function Alerta({ tipo = 'error', children }: { tipo?: 'error' | 'ok' | 'info' | 'aviso'; children: ReactNode }) {
  const cls = {
    error: 'border-red-200 bg-red-50 text-red-700',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    aviso: 'border-amber-200 bg-amber-50 text-amber-800',
  }[tipo]
  return <div className={`rounded-md border px-3 py-2 text-sm ${cls}`}>{children}</div>
}

export function Titulo({ children, sub, acciones }: { children: ReactNode; sub?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{children}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {acciones}
    </div>
  )
}

// Carga datos de la API con estado de carga/error y recarga manual.
export function useCarga<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargar = useCallback(() => {
    setCargando(true)
    return fn()
      .then((d) => {
        setDatos(d)
        setError(null)
      })
      .catch((e) => setError(mensajeError(e)))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => {
    cargar()
  }, [cargar])
  return { datos, error, cargando, recargar: cargar, setDatos }
}

export function Cargando() {
  return <p className="text-sm text-slate-500">Cargando…</p>
}

export const fechaCorta = (f?: string | null) => (f ? new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
