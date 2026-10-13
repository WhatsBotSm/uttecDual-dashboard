import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Table } from '../../components/Table'
import { Alerta, Cargando, Titulo, fechaCorta, useCarga } from '../../components/ui'
import { api, mensajeError } from '../../lib/api'
import type { AsignacionResumen, DetalleAsignacion, FormatoItem } from '../../lib/types'

interface Dash {
  asignacion: AsignacionResumen | null
  solicitud: { id_solicitud: number; estatus: string; empresa: string } | null
  materias: number
  evaluaciones_pendientes: number
  formatos_rechazados: number
  formatos: FormatoItem[]
}

const etiquetaFormato = (f: FormatoItem) => `${f.codigo.replace('FOR-GSE-SAC-01-', 'Formato ')}${f.parcial ? ` · Parcial ${f.parcial}` : ''}`

export function AlumnoDashboardPage() {
  const { datos: d, error, cargando } = useCarga(() => api.get<Dash>('/alumno/dashboard'))
  if (cargando) return <Cargando />
  if (error || !d) return <Alerta>{error}</Alerta>
  const a = d.asignacion
  return (
    <div className="space-y-6">
      <Titulo sub="Resumen de tu situación en el programa de Educación Dual">Panel principal</Titulo>
      {d.formatos_rechazados > 0 && <Alerta tipo="aviso">Tienes {d.formatos_rechazados} formato(s) rechazado(s) por el Enlace de Educación Dual. Edítalos siguiendo sus indicaciones y vuelve a enviarlos.</Alerta>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Unidad económica">
          {a ? <><p className="text-base font-semibold text-slate-900">{a.empresa}</p><p className="text-sm text-slate-500">{a.proyecto ?? 'Sin proyecto asignado'}</p></> :
            <><p className="text-sm text-slate-500">Aún no tienes unidad económica asignada.</p>
              {d.solicitud && <p className="mt-2 text-sm">Última solicitud: {d.solicitud.empresa} <Badge>{d.solicitud.estatus}</Badge></p>}
              <Link to="/alumno/catalogo" className="mt-2 inline-block text-sm text-brand-600 hover:underline">Ver el catálogo →</Link></>}
        </Card>
        <Card title="Materias de la estancia"><p className="text-3xl font-semibold text-slate-900">{d.materias}</p></Card>
        <Card title="Evaluaciones pendientes"><p className="text-3xl font-semibold text-slate-900">{d.evaluaciones_pendientes}</p><p className="text-sm text-slate-500">parciales sin evaluar</p></Card>
      </div>
      {a && (
        <Card title={`Mis formatos — cuatrimestre ${a.cuatrimestre}º`} actions={<Link to="/alumno/formatos" className="text-sm text-brand-600 hover:underline">Ver todos</Link>}>
          <Table rows={d.formatos} rowKey={(f) => String(f.id_rel)} columns={[
            { header: 'Formato', render: (f) => etiquetaFormato(f) },
            { header: 'Nombre', render: (f) => f.nombre },
            { header: 'Estatus', render: (f) => <Badge>{f.estatus}</Badge> },
            { header: 'Evaluación', render: (f) => (f.clave === 'N' || f.clave === 'O' ? <Badge>{f.estatus_evaluacion}</Badge> : '—') },
            { header: '', render: (f) => <Link to={`/formato/${f.id_rel}`} className="text-brand-600 hover:underline">Abrir</Link> },
          ]} />
        </Card>
      )}
    </div>
  )
}

interface CatEmpresa {
  id_empresa: number
  razon_social: string
  direccion: string | null
  telefono: string | null
  apoyos: string | null
  horarios: string | null
  monto: string | null
  cupo_actual: number
  iniciativas: { id_iniciativa_empresa: number; nombre_proyecto: string; descripcion: string | null; cupo_disponible: number }[]
}
interface Solic { id_solicitud: number; empresa: string; nombre_proyecto: string | null; estatus: string; fecha_solicitud: string }

export function AlumnoCatalogoPage() {
  const cat = useCarga(() => api.get<CatEmpresa[]>('/alumno/catalogo'))
  const sol = useCarga(() => api.get<Solic[]>('/alumno/solicitudes'))
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [ini, setIni] = useState<Record<number, string>>({})
  const abierta = sol.datos?.find((s) => ['PENDIENTE', 'EN_PROCESO'].includes(s.estatus))

  const solicitar = async (e: CatEmpresa) => {
    setMsg(null)
    try {
      await api.post('/alumno/solicitudes', { id_empresa: e.id_empresa, id_iniciativa_empresa: ini[e.id_empresa] ? Number(ini[e.id_empresa]) : undefined })
      setMsg({ tipo: 'ok', texto: `Solicitud enviada a ${e.razon_social}.` })
      sol.recargar()
    } catch (err) { setMsg({ tipo: 'error', texto: mensajeError(err) }) }
  }
  const cancelar = async (id: number) => {
    try { await api.del(`/alumno/solicitudes/${id}`); sol.recargar() } catch (err) { setMsg({ tipo: 'error', texto: mensajeError(err) }) }
  }
  if (cat.cargando) return <Cargando />
  return (
    <div className="space-y-6">
      <Titulo sub="Puedes tener una solicitud abierta a la vez.">Unidades económicas disponibles</Titulo>
      {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}
      {abierta && <Alerta tipo="info">Tienes una solicitud abierta con <strong>{abierta.empresa}</strong> (<Badge>{abierta.estatus}</Badge>). Para solicitar otra, cancélala primero.</Alerta>}
      <div className="grid gap-4 sm:grid-cols-2">
        {cat.datos?.map((e) => (
          <Card key={e.id_empresa} title={e.razon_social} actions={<Badge tone={e.cupo_actual > 0 ? 'green' : 'red'}>{e.cupo_actual > 0 ? `CUPO ${e.cupo_actual}` : 'SIN CUPO'}</Badge>}>
            <p className="text-sm text-slate-600">{e.direccion ?? '—'}</p>
            <p className="mt-1 text-xs text-slate-500">Horario: {e.horarios ?? '—'} · Apoyos: {e.apoyos ?? '—'} {e.monto ? `· Monto: $${e.monto}` : ''}</p>
            {e.iniciativas.length > 0 && (
              <select className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={ini[e.id_empresa] ?? ''} onChange={(ev) => setIni({ ...ini, [e.id_empresa]: ev.target.value })}>
                <option value="">Cualquier iniciativa</option>
                {e.iniciativas.map((i) => <option key={i.id_iniciativa_empresa} value={i.id_iniciativa_empresa}>{i.nombre_proyecto} (cupo {i.cupo_disponible})</option>)}
              </select>
            )}
            <Button className="mt-3" disabled={e.cupo_actual <= 0 || !!abierta} onClick={() => solicitar(e)}>Enviar solicitud de interés</Button>
          </Card>
        ))}
      </div>
      <Card title="Mis solicitudes">
        <Table rows={sol.datos ?? []} rowKey={(s) => String(s.id_solicitud)} emptyMessage="Aún no has enviado solicitudes." columns={[
          { header: 'Unidad económica', render: (s) => s.empresa }, { header: 'Iniciativa', render: (s) => s.nombre_proyecto ?? '—' },
          { header: 'Fecha', render: (s) => fechaCorta(s.fecha_solicitud) }, { header: 'Estatus', render: (s) => <Badge>{s.estatus}</Badge> },
          { header: '', render: (s) => (['PENDIENTE', 'EN_PROCESO'].includes(s.estatus) ? <button type="button" className="text-red-600 hover:underline" onClick={() => cancelar(s.id_solicitud)}>Cancelar</button> : null) },
        ]} />
      </Card>
    </div>
  )
}

export function AlumnoEstadiaPage() {
  const dash = useCarga(() => api.get<Dash>('/alumno/dashboard'))
  const id = dash.datos?.asignacion?.id_asignacion
  const det = useCarga(async () => (id ? api.get<DetalleAsignacion>(`/asignaciones/${id}`) : null), [id])
  if (dash.cargando || det.cargando) return <Cargando />
  const d = det.datos
  if (!d) return <div className="space-y-4"><Titulo>Mi estadía</Titulo><Alerta tipo="info">Aún no tienes una asignación. Consulta el catálogo de unidades económicas y envía tu solicitud.</Alerta></div>
  return (
    <div className="space-y-6">
      <Titulo sub={`${d.programa} · escala de evaluación versión ${d.version}`}>Mi estadía — {d.empresa}</Titulo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Proyecto y horario">
          <p className="font-medium">{d.proyecto ?? 'Sin proyecto'}</p>
          <p className="text-sm text-slate-500">Cuatrimestre {d.cuatrimestre}º · Días: {d.dias_asistencia ?? '—'} · Horario: {d.horario ?? '—'}</p>
        </Card>
        <Card title="Mentores (contacto)">
          <p className="text-sm"><strong>Mentor de la UE:</strong> {d.mentor_ue?.nombre_completo ?? '—'} · {d.mentor_ue?.correo ?? ''} {d.mentor_ue?.telefono ?? ''}</p>
          <p className="text-sm"><strong>Mentor Académico:</strong> {d.mentor_academico?.nombre_completo ?? 'Por asignar'} · {d.mentor_academico?.correo ?? ''}</p>
        </Card>
      </div>
      <Card title="Competencias asignadas a mis actividades">
        <Table rows={d.competencias} rowKey={(c) => String(c.id_cat_competencia)} columns={[
          { header: 'No.', render: (c) => c.no_competencia }, { header: 'Competencia', render: (c) => c.descripcion_competencia },
          { header: 'Asignaturas', render: (c) => c.asignaturas.map((s) => s.clave).join(', ') },
        ]} />
      </Card>
      <Card title="Calificaciones por parcial y asignatura" subtitle="Promedio de las actividades ya evaluadas por el Mentor de la UE">
        <Table rows={d.asignaturas} rowKey={(s) => String(s.id_asignatura)} columns={[
          { header: 'Asignatura', render: (s) => `${s.clave} — ${s.nombre}` },
          ...[1, 2, 3].map((p) => ({ header: `Parcial ${p}`, render: (s: { id_asignatura: number }) => d.calificaciones[p]?.find((x) => x.id_asignatura === s.id_asignatura)?.promedio ?? '—' })),
        ]} />
        <p className="mt-2 text-xs text-slate-500">Estatus de evaluación: {d.formatos.filter((f) => f.clave === 'N').map((f) => `P${f.parcial}: ${f.estatus_evaluacion.replace('_', ' ')}`).join(' · ')}</p>
      </Card>
      <Card title="Planeación por parcial">
        {d.asignaturas.map((s) => (
          <div key={s.id_asignatura} className="mb-3">
            <p className="text-sm font-semibold text-slate-700">{s.clave} — {s.nombre}</p>
            <ul className="ml-4 list-disc text-sm text-slate-600">
              {d.planeacion.filter((t) => t.id_asignatura === s.id_asignatura).map((t) => <li key={t.id_planeacion_tema}>P{t.parcial}: {t.titulo}{t.resultado_esperado ? ` — ${t.resultado_esperado}` : ''}</li>)}
            </ul>
          </div>
        ))}
      </Card>
      <Card title="Puestos de aprendizaje" actions={<Link to={`/formato/${d.formatos.find((f) => f.clave === 'M')?.id_rel}`} className="text-sm text-brand-600 hover:underline">Gestionar (formato M)</Link>}>
        {d.puestos.length === 0 ? <p className="text-sm text-slate-500">Sin puestos registrados.</p> : <ul className="list-disc pl-5 text-sm">{d.puestos.map((p) => <li key={p.id_puesto}>{p.nombre} — {p.periodo ?? 'sin periodo'}</li>)}</ul>}
      </Card>
    </div>
  )
}

export function AlumnoFormatosPage() {
  const dash = useCarga(() => api.get<Dash>('/alumno/dashboard'))
  if (dash.cargando) return <Cargando />
  const d = dash.datos
  if (!d?.asignacion) return <div className="space-y-4"><Titulo>Mis formatos</Titulo><Alerta tipo="info">Tus formatos aparecerán cuando tengas una asignación.</Alerta></div>
  return (
    <div className="space-y-6">
      <Titulo sub="Los formatos se precargan con tu información; captura los tuyos y envíalos a revisión.">Mis formatos</Titulo>
      <Card>
        <Table rows={d.formatos} rowKey={(f) => String(f.id_rel)} columns={[
          { header: 'Formato', render: (f) => etiquetaFormato(f) }, { header: 'Nombre', render: (f) => f.nombre },
          { header: 'Estatus', render: (f) => <Badge>{f.estatus}</Badge> },
          { header: 'Evaluación', render: (f) => (f.clave === 'N' || f.clave === 'O' ? <Badge>{f.estatus_evaluacion}</Badge> : '—') },
          { header: 'Observaciones', render: (f) => f.observaciones ?? '—' },
          { header: '', render: (f) => <span className="flex gap-3"><Link to={`/formato/${f.id_rel}`} className="text-brand-600 hover:underline">Abrir</Link><Link to={`/formato/${f.id_rel}/imprimir`} target="_blank" className="text-brand-600 hover:underline">Imprimir</Link></span> },
        ]} />
      </Card>
    </div>
  )
}
