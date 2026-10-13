import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alerta, Campo, inputCls } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api, ApiError, mensajeError } from '../lib/api'
import type { Rol } from '../lib/types'

export const inicioPorRol: Record<Rol, string> = {
  ALUMNO: '/alumno',
  MENTOR_UE: '/mentor-ue',
  MENTOR_ACADEMICO: '/mentor-academico',
  ENLACE_DUAL: '/enlace',
}

function Marco({ children, titulo }: { children: React.ReactNode; titulo: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">UTTEC-DUAL</h1>
          <p className="mt-1 text-sm text-slate-500">Sistema de Gestión de Educación Dual — Universidad Tecnológica de Tecámac</p>
        </div>
        <Card title={titulo}>{children}</Card>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { usuario, entrar } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  if (usuario) return <Navigate to={inicioPorRol[usuario.rol]} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      await entrar(correo, password)
      navigate('/')
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setCargando(false)
    }
  }

  return (
    <Marco titulo="Iniciar sesión">
      <form onSubmit={enviar} className="space-y-3">
        <Campo label="Usuario (correo)">
          <input className={inputCls} type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="username" />
        </Campo>
        <Campo label="Contraseña">
          <input className={inputCls} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Campo>
        {error && <Alerta>{error}</Alerta>}
        <Button type="submit" className="w-full" disabled={cargando}>
          {cargando ? 'Procesando…' : 'Entrar'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Eres alumno y aún no tienes cuenta? <Link to="/registro" className="font-medium text-brand-600 hover:underline">Regístrate</Link>
      </p>
    </Marco>
  )
}

interface ProgramaOpt { id: number; nombre_carrera: string; version: string; duracion: number }

export function RegistroPage() {
  const { usuario, registrar } = useAuth()
  const navigate = useNavigate()
  const [programas, setProgramas] = useState<ProgramaOpt[]>([])
  const [f, setF] = useState({ matricula: '', correo: '', telefono: '', id_programa: '', cuatrimestre_actual: '', password: '', nombre: '', apellido_paterno: '', apellido_materno: '' })
  const [pedirNombre, setPedirNombre] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    api.get<ProgramaOpt[]>('/auth/programas').then(setProgramas).catch(() => undefined)
  }, [])
  if (usuario) return <Navigate to={inicioPorRol[usuario.rol]} replace />
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      await registrar({ ...f, id_programa: Number(f.id_programa), cuatrimestre_actual: Number(f.cuatrimestre_actual) })
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setPedirNombre(true)
      setError(mensajeError(err))
    } finally {
      setCargando(false)
    }
  }

  return (
    <Marco titulo="Registro de alumno">
      <form onSubmit={enviar} className="space-y-3">
        <p className="text-xs text-slate-500">Tu nombre completo se obtiene de los servicios de la Universidad a partir de tu matrícula.</p>
        <Campo label="Matrícula"><input className={inputCls} required value={f.matricula} onChange={set('matricula')} /></Campo>
        {pedirNombre && (
          <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
            <Campo label="Nombre(s)"><input className={inputCls} required value={f.nombre} onChange={set('nombre')} /></Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Apellido paterno"><input className={inputCls} required value={f.apellido_paterno} onChange={set('apellido_paterno')} /></Campo>
              <Campo label="Apellido materno"><input className={inputCls} value={f.apellido_materno} onChange={set('apellido_materno')} /></Campo>
            </div>
          </div>
        )}
        <Campo label="Correo electrónico"><input className={inputCls} type="email" required value={f.correo} onChange={set('correo')} /></Campo>
        <Campo label="Teléfono"><input className={inputCls} value={f.telefono} onChange={set('telefono')} /></Campo>
        <Campo label="Carrera (programa educativo)">
          <select className={inputCls} required value={f.id_programa} onChange={set('id_programa')}>
            <option value="">Selecciona…</option>
            {programas.map((p) => <option key={p.id} value={p.id}>{p.nombre_carrera} (versión {p.version})</option>)}
          </select>
        </Campo>
        <Campo label="Cuatrimestre actual"><input className={inputCls} type="number" min={1} max={11} required value={f.cuatrimestre_actual} onChange={set('cuatrimestre_actual')} /></Campo>
        <Campo label="Contraseña" ayuda="Mínimo 8 caracteres."><input className={inputCls} type="password" minLength={8} required value={f.password} onChange={set('password')} autoComplete="new-password" /></Campo>
        {error && <Alerta>{error}</Alerta>}
        <Button type="submit" className="w-full" disabled={cargando}>{cargando ? 'Registrando…' : 'Crear cuenta'}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link to="/login" className="font-medium text-brand-600 hover:underline">Inicia sesión</Link></p>
    </Marco>
  )
}
