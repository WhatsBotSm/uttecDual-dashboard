// Tipos de las respuestas de la API (ver CONTRATO_API.md y el repo uttec-dual-backend: src/routes y db/schema.sql).

export type Rol = 'ALUMNO' | 'MENTOR_UE' | 'MENTOR_ACADEMICO' | 'ENLACE_DUAL'

export interface Usuario {
  id_cat_user: number
  rol: Rol
  modulos: string[]
  permisos: string[]
  nombre: string
  nombre_pila: string | null
  apellido_paterno: string | null
  apellido_materno: string | null
  correo: string
  telefono: string | null
  id_externo: string | null
  datos_de_universidad: boolean
  id_alumno: number | null
  id_personal_dual: number | null
}

export interface PersonaVista {
  nombre_completo: string
  correo: string
  telefono: string | null
  id_externo: string | null
}

export type EstatusFormato = 'BORRADOR' | 'EN_REVISION' | 'ACEPTADO' | 'RECHAZADO'
export type EstatusEvaluacion = 'PENDIENTE' | 'EN_REVISION' | 'EVALUADO'

export interface AsignacionResumen {
  id_asignacion: number
  id_alumno: number
  matricula: string
  cuatrimestre: number
  cuatrimestre_actual: number
  estatus: 'ACTIVA' | 'FINALIZADA' | 'CANCELADA'
  id_empresa: number
  empresa: string
  programa: string
  version: '2020' | '2024'
  proyecto: string | null
  duracion_estancia_dual: number | null
  dias_asistencia: string | null
  horario: string | null
  id_personal_dual: number | null
  id_mentor_ue: number | null
  parciales_pendientes: number
  formatos_en_revision: number
  alumno: PersonaVista | null
  mentor_ue: PersonaVista | null
  mentor_academico: PersonaVista | null
}

export interface FormatoItem {
  id_rel: number
  parcial: number
  estatus: EstatusFormato
  estatus_evaluacion: EstatusEvaluacion
  observaciones: string | null
  fecha_envio: string | null
  clave: 'K' | 'L' | 'M' | 'N' | 'O'
  codigo: string
  nombre: string
}

export interface Escala {
  codigo: string
  nombre: string
  valor: number
  orden: number
}

export interface Asignatura {
  id_asignatura: number
  clave: string
  nombre: string
}

export interface Competencia {
  id_cat_competencia: number
  no_competencia: number
  descripcion_competencia: string
  asignaturas: Asignatura[]
}

export interface Puesto {
  id_puesto: number
  nombre: string
  cuatrimestre: number | null
  periodo: string | null
  objetivo: string | null
  requerimientos: string | null
  actividades: string | null
  conocimientos_teoricos: string | null
  conocimientos_procedimentales: string | null
  conocimientos_actitudinales: string | null
}

export interface Actividad {
  id_actividades: number
  descripcion_actividad: string
  desempeno: string | null
  entregable: string | null
  horas_dedicacion: number | null
  id_cat_competencia: number
  id_asignacion: number
  parcial: number
  id_asignatura: number
  no_competencia: number
  descripcion_competencia: string
  clave_asignatura: string
  nombre_asignatura: string
  valor: number | null
}

export interface CalifAsignatura {
  id_asignatura: number
  clave: string
  nombre: string
  actividades: number
  calificadas: number
  promedio: number | null
}

export interface DetalleAsignacion extends AsignacionResumen {
  asignaturas: Asignatura[]
  formatos: FormatoItem[]
  puestos: Puesto[]
  escala: Escala[]
  competencias: Competencia[]
  planeacion: { id_planeacion_tema: number; id_asignatura: number; parcial: number; titulo: string; descripcion: string | null; resultado_esperado: string | null }[]
  calificaciones: Record<number, CalifAsignatura[]>
}

export interface ContenidoFormato {
  [k: string]: unknown
}

export interface Imprimible {
  formato: {
    id_rel: number
    clave: FormatoItem['clave']
    codigo: string
    nombre: string
    parcial: number
    estatus: EstatusFormato
    estatus_evaluacion: EstatusEvaluacion
    retroalimentacion: string | null
    observaciones: string | null
    contenido: ContenidoFormato
  }
  asignacion: AsignacionResumen
  programa: { nombre_carrera: string; version: string; institucion_educativa: string; division: string }
  empresa: { razon_social: string; direccion: string | null; telefono: string | null; apoyos: string | null; horarios: string | null; monto: string | null }
  iniciativa: { nombre_proyecto: string; descripcion: string | null; objetivo_proyecto: string | null; duracion: string | null } | null
  asignaturas: Asignatura[]
  puestos: Puesto[]
  escala: Escala[]
  competencias: Competencia[]
  actividades: Actividad[]
  calificaciones: Record<number, CalifAsignatura[]>
}
