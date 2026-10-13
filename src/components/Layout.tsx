import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Rol } from '../lib/types'

interface NavItem {
  to: string
  label: string
  modulo: string
  end?: boolean
}

// Los módulos visibles salen de cat_user.cat_modulos (backend); aquí solo se asocia cada módulo a su ruta.
const navPorRol: Record<Rol, NavItem[]> = {
  ALUMNO: [
    { to: '/alumno', label: 'Panel principal', modulo: 'dashboard', end: true },
    { to: '/alumno/catalogo', label: 'Unidades económicas', modulo: 'catalogo' },
    { to: '/alumno/estadia', label: 'Mi estadía', modulo: 'estadia' },
    { to: '/alumno/formatos', label: 'Mis formatos', modulo: 'formatos' },
    { to: '/perfil', label: 'Mi perfil', modulo: 'perfil' },
  ],
  MENTOR_UE: [
    { to: '/mentor-ue', label: 'Alumnos asignados', modulo: 'alumnos', end: true },
    { to: '/perfil', label: 'Mi perfil', modulo: 'perfil' },
  ],
  MENTOR_ACADEMICO: [
    { to: '/mentor-academico', label: 'Alumnos supervisados', modulo: 'alumnos', end: true },
    { to: '/perfil', label: 'Mi perfil', modulo: 'perfil' },
  ],
  ENLACE_DUAL: [
    { to: '/enlace', label: 'Panel principal', modulo: 'dashboard', end: true },
    { to: '/enlace/revision', label: 'Revisión de formatos', modulo: 'revision' },
    { to: '/enlace/solicitudes', label: 'Solicitudes de interés', modulo: 'solicitudes' },
    { to: '/enlace/asignaciones', label: 'Asignaciones', modulo: 'asignaciones' },
    { to: '/enlace/empresas', label: 'Unidades económicas', modulo: 'empresas' },
    { to: '/enlace/programas', label: 'Programas y asignaturas', modulo: 'programas' },
    { to: '/enlace/competencias', label: 'Competencias', modulo: 'competencias' },
    { to: '/enlace/planeacion', label: 'Planeación', modulo: 'planeacion' },
    { to: '/enlace/personas', label: 'Personas y cuentas', modulo: 'personas' },
    { to: '/perfil', label: 'Mi perfil', modulo: 'perfil' },
  ],
}

const rolLabel: Record<Rol, string> = {
  ALUMNO: 'Alumno',
  MENTOR_UE: 'Mentor de Unidad Económica',
  MENTOR_ACADEMICO: 'Mentor Académico',
  ENLACE_DUAL: 'Enlace de Educación Dual',
}

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, salir } = useAuth()
  const navigate = useNavigate()
  if (!usuario) return <>{children}</>
  const items = navPorRol[usuario.rol].filter((i) => usuario.modulos.includes(i.modulo))

  return (
    <div className="flex min-h-screen">
      <aside className="no-print flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <p className="text-sm font-semibold text-brand-700">UTTEC-DUAL</p>
          <p className="text-xs text-slate-500">Gestión de Educación Dual</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-sm font-medium text-slate-800">{usuario.nombre}</p>
          <p className="text-xs text-slate-500">{rolLabel[usuario.rol]}</p>
          <button
            type="button"
            onClick={() => {
              salir()
              navigate('/login')
            }}
            className="mt-3 text-xs font-medium text-brand-600 hover:text-brand-800"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 px-8 py-6">{children}</main>
    </div>
  )
}
