import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import type { Rol } from './lib/types'
import { inicioPorRol, LoginPage, RegistroPage } from './pages/Acceso'
import { FormatoPage, ImprimirFormatoPage } from './pages/FormatoPage'
import { PerfilPage } from './pages/Perfil'
import { AlumnoCatalogoPage, AlumnoDashboardPage, AlumnoEstadiaPage, AlumnoFormatosPage } from './pages/alumno/Alumno'
import { EnlaceAsignacionesPage, EnlaceDashboardPage, EnlaceEmpresasPage, EnlaceRevisionPage, EnlaceSolicitudesPage } from './pages/enlace/Enlace'
import { EnlaceCompetenciasPage, EnlacePlaneacionPage, EnlaceProgramasPage } from './pages/enlace/Catalogos'
import { EnlacePersonasPage } from './pages/enlace/Personas'
import { ListaAlumnosPage, MentorAcademicoDetallePage, MentorUeDetallePage } from './pages/mentores/Mentores'

// Requiere sesión y, opcionalmente, un rol. El backend vuelve a validar rol, permiso y relación con el
// recurso en cada petición; esto solo evita mostrar pantallas que no corresponden.
function Protegida({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <p className="p-6 text-sm text-slate-500">Cargando…</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to={inicioPorRol[usuario.rol]} replace />
  return <Layout>{children}</Layout>
}

// Sesión requerida pero sin menú lateral (hoja imprimible).
function SoloSesion({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <p className="p-6 text-sm text-slate-500">Cargando…</p>
  if (!usuario) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Inicio() {
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  return <Navigate to={usuario ? inicioPorRol[usuario.rol] : '/login'} replace />
}

function Rutas() {
  const ENLACE: Rol[] = ['ENLACE_DUAL']
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />

      <Route path="/perfil" element={<Protegida><PerfilPage /></Protegida>} />

      <Route path="/alumno" element={<Protegida roles={['ALUMNO']}><AlumnoDashboardPage /></Protegida>} />
      <Route path="/alumno/catalogo" element={<Protegida roles={['ALUMNO']}><AlumnoCatalogoPage /></Protegida>} />
      <Route path="/alumno/estadia" element={<Protegida roles={['ALUMNO']}><AlumnoEstadiaPage /></Protegida>} />
      <Route path="/alumno/formatos" element={<Protegida roles={['ALUMNO']}><AlumnoFormatosPage /></Protegida>} />

      <Route path="/mentor-ue" element={<Protegida roles={['MENTOR_UE']}><ListaAlumnosPage base="/mentor-ue" titulo="Alumnos asignados" sub="Evalúa los 3 parciales de cada alumno de tu unidad económica." /></Protegida>} />
      <Route path="/mentor-ue/alumno/:id" element={<Protegida roles={['MENTOR_UE']}><MentorUeDetallePage /></Protegida>} />

      <Route path="/mentor-academico" element={<Protegida roles={['MENTOR_ACADEMICO']}><ListaAlumnosPage base="/mentor-academico" titulo="Alumnos supervisados" sub="Seguimiento académico en modo lectura, con historial de cuatrimestres." /></Protegida>} />
      <Route path="/mentor-academico/alumno/:id" element={<Protegida roles={['MENTOR_ACADEMICO']}><MentorAcademicoDetallePage /></Protegida>} />

      <Route path="/enlace" element={<Protegida roles={ENLACE}><EnlaceDashboardPage /></Protegida>} />
      <Route path="/enlace/revision" element={<Protegida roles={ENLACE}><EnlaceRevisionPage /></Protegida>} />
      <Route path="/enlace/solicitudes" element={<Protegida roles={ENLACE}><EnlaceSolicitudesPage /></Protegida>} />
      <Route path="/enlace/asignaciones" element={<Protegida roles={ENLACE}><EnlaceAsignacionesPage /></Protegida>} />
      <Route path="/enlace/empresas" element={<Protegida roles={ENLACE}><EnlaceEmpresasPage /></Protegida>} />
      <Route path="/enlace/programas" element={<Protegida roles={ENLACE}><EnlaceProgramasPage /></Protegida>} />
      <Route path="/enlace/competencias" element={<Protegida roles={ENLACE}><EnlaceCompetenciasPage /></Protegida>} />
      <Route path="/enlace/planeacion" element={<Protegida roles={ENLACE}><EnlacePlaneacionPage /></Protegida>} />
      <Route path="/enlace/personas" element={<Protegida roles={ENLACE}><EnlacePersonasPage /></Protegida>} />

      <Route path="/formato/:id" element={<Protegida><FormatoPage /></Protegida>} />
      <Route path="/formato/:id/imprimir" element={<SoloSesion><ImprimirFormatoPage /></SoloSesion>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Rutas />
      </AuthProvider>
    </BrowserRouter>
  )
}
