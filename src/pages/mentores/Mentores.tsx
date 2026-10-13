import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Modal } from '../../components/Modal'
import { Table } from '../../components/Table'
import { Alerta, Campo, Cargando, Titulo, inputCls, useCarga } from '../../components/ui'
import { api, mensajeError } from '../../lib/api'
import type { AsignacionResumen, DetalleAsignacion, Escala, EstatusEvaluacion, EstatusFormato } from '../../lib/types'

export function ListaAlumnosPage({ base, titulo, sub }: { base: string; titulo: string; sub: string }) {
  const { datos, error, cargando } = useCarga(() => api.get<AsignacionResumen[]>('/mis-asignaciones'))
  if (cargando) return <Cargando />
  if (error) return <Alerta>{error}</Alerta>
  return (
    <div className="space-y-6">
      <Titulo sub={sub}>{titulo}</Titulo>
      <Card>
        <Table rows={datos ?? []} rowKey={(a) => String(a.id_asignacion)} emptyMessage="No tienes alumnos asignados." columns={[
          { header: 'Alumno', render: (a) => a.alumno?.nombre_completo ?? '—' },
          { header: 'Matrícula', render: (a) => a.matricula },
          { header: 'Programa', render: (a) => `${a.programa} (v${a.version})` },
          { header: 'Unidad económica', render: (a) => a.empresa },
          { header: 'Cuatrimestre', render: (a) => `${a.cuatrimestre}º` },
          { header: 'Asignación', render: (a) => <Badge>{a.estatus}</Badge> },
          { header: 'Parciales pendientes', render: (a) => (a.parciales_pendientes ? <Badge tone="amber">{`${a.parciales_pendientes} PENDIENTES`}</Badge> : <Badge tone="green">AL DÍA</Badge>) },
          { header: '', render: (a) => <Link to={`${base}/alumno/${a.id_asignacion}`} className="text-brand-600 hover:underline">Ver detalle →</Link> },
        ]} />
      </Card>
    </div>
  )
}

// ---------------- Evaluación de un parcial (Mentor de UE) ----------------
interface ActEval {
  id_actividades: number
  descripcion_actividad: string
  entregable: string | null
  horas_dedicacion: number | null
  desempeno: string | null
}
interface EvalData {
  formato: { id_rel: number; parcial: number; estatus: EstatusFormato; estatus_evaluacion: EstatusEvaluacion; observaciones: string | null; retroalimentacion: string | null; contenido: Record<string, unknown> }
  escala: Escala[]
  competencias: { id_cat_competencia: number; no_competencia: number; descripcion_competencia: string; asignaturas: { id_asignatura: number; clave: string; nombre: string; actividades: ActEval[] }[] }[]
  calificaciones: { id_asignatura: number; clave: string; promedio: number | null; calificadas: number; actividades: number }[]
  todas_calificadas: boolean
}

function EvaluacionParcial({ idAsignacion, parcial, puedeCalificar, alCambiar }: { idAsignacion: number; parcial: number; puedeCalificar: boolean; alCambiar?: () => void }) {
  const { datos: d, error, cargando, recargar } = useCarga(() => api.get<EvalData>(`/asignaciones/${idAsignacion}/evaluacion/${parcial}`), [idAsignacion, parcial])
  const [retro, setRetro] = useState('')
  const [detalle, setDetalle] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  useEffect(() => { if (d) setRetro(d.formato.retroalimentacion ?? '') }, [d])
  if (cargando && !d) return <Cargando />
  if (error || !d) return <Alerta>{error}</Alerta>
  const f = d.formato
  const cerrada = f.estatus_evaluacion === 'EVALUADO'
  const bloqueada = f.estatus === 'BORRADOR' || cerrada || !puedeCalificar
  const c = f.contenido as Record<string, string>

  const accion = async (fn: () => Promise<unknown>, ok?: string) => {
    setMsg(null)
    try { await fn(); if (ok) setMsg({ tipo: 'ok', texto: ok }); await recargar(); alCambiar?.() } catch (e) { setMsg({ tipo: 'error', texto: mensajeError(e) }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setDetalle(true)} className="text-sm font-medium text-brand-600 hover:underline">▸ Ver detalle del reporte del alumno</button>
        <Link to={`/formato/${f.id_rel}`} className="text-sm font-medium text-brand-600 hover:underline">Abrir formato Ñ completo →</Link>
      </div>
      <Modal open={detalle} title={`Reporte del alumno — Parcial ${parcial}`} onClose={() => setDetalle(false)} footer={<Button variant="ghost" onClick={() => setDetalle(false)}>Cerrar</Button>}>
        <div className="space-y-3 text-sm">
          <p className="font-semibold">{c.nombre_proyecto || 'Sin datos capturados'}</p>
          <div><p className="font-medium text-slate-700">Marco teórico o antecedentes</p><p className="whitespace-pre-wrap text-slate-600">{c.marco_teorico || '—'}</p></div>
          <div><p className="font-medium text-slate-700">Descripción de las actividades realizadas</p><p className="whitespace-pre-wrap text-slate-600">{c.descripcion_actividades || '—'}</p></div>
        </div>
      </Modal>
      {f.estatus === 'BORRADOR' && <Alerta tipo="aviso">El alumno aún no envía el reporte de este parcial; no se puede calificar todavía.</Alerta>}
      {d.competencias.length === 0 ? <p className="text-sm text-slate-500">El alumno aún no registra actividades en este parcial.</p> : d.competencias.map((comp) => (
        <div key={comp.id_cat_competencia} className="rounded-md border border-slate-200 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-800">Competencia {comp.no_competencia} — {comp.descripcion_competencia}</p>
          {comp.asignaturas.map((s) => {
            const prom = d.calificaciones.find((x) => x.id_asignatura === s.id_asignatura)?.promedio
            return (
              <div key={s.id_asignatura} className="mb-2 last:mb-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.clave} — {s.nombre} <span className="ml-2 normal-case text-slate-400">promedio de la asignatura: {prom ?? '—'}</span></p>
                <table className="mt-1 w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {s.actividades.map((a) => (
                      <tr key={a.id_actividades}>
                        <td className="py-2 pr-3 align-top">{a.descripcion_actividad}<span className="block text-xs text-slate-500">Evidencia: {a.entregable ?? '—'} · {a.horas_dedicacion ?? '—'} h</span></td>
                        <td className="w-52 py-2 align-top">
                          <select className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={a.desempeno ?? ''} disabled={bloqueada}
                            onChange={(e) => accion(() => api.put(`/actividades/${a.id_actividades}/desempeno`, { desempeno: e.target.value || null }))}>
                            <option value="">Sin calificar</option>
                            {d.escala.map((n) => <option key={n.codigo} value={n.codigo}>{n.codigo} — {n.nombre} ({n.valor})</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      ))}
      <Campo label="Retroalimentación general del parcial">
        <textarea className={inputCls} rows={3} value={retro} disabled={bloqueada} onChange={(e) => setRetro(e.target.value)} />
      </Campo>
      {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}
      {!bloqueada && (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => accion(() => api.put(`/formatos/${f.id_rel}/retroalimentacion`, { retroalimentacion: retro }), 'Avance guardado.')}>Guardar avance</Button>
          <Button disabled={!d.todas_calificadas || !retro.trim()} onClick={() => accion(async () => { await api.put(`/formatos/${f.id_rel}/retroalimentacion`, { retroalimentacion: retro }); await api.post(`/formatos/${f.id_rel}/cerrar-evaluacion`) }, 'Evaluación cerrada.')}>Cerrar evaluación</Button>
        </div>
      )}
      {cerrada && <Badge tone="green">EVALUADO</Badge>}
    </div>
  )
}

// ---------------- Cierre del cuatrimestre (formato O) ----------------
interface CierreO {
  escala: Escala[]
  parciales_evaluados: number
  puede_cerrar: boolean
  estatus_evaluacion: EstatusEvaluacion
  guardadas: Record<string, { codigo: string }> | null
  asignaturas: { id_asignatura: number; clave: string; nombre: string; promedio: number | null; codigo_sugerido: string | null }[]
}
function CierreCuatrimestre({ idAsignacion, idFormatoO }: { idAsignacion: number; idFormatoO?: number }) {
  const { datos: d, recargar } = useCarga(() => api.get<CierreO>(`/asignaciones/${idAsignacion}/cierre-o`), [idAsignacion])
  const [sel, setSel] = useState<Record<number, string>>({})
  const [retro, setRetro] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  if (!d) return <Cargando />
  const cerrado = d.estatus_evaluacion === 'EVALUADO'
  const valor = (a: CierreO['asignaturas'][number]) => sel[a.id_asignatura] ?? d.guardadas?.[String(a.id_asignatura)]?.codigo ?? a.codigo_sugerido ?? ''
  const guardar = async () => {
    try {
      await api.put(`/asignaciones/${idAsignacion}/cierre-o`, { calificaciones: d.asignaturas.map((a) => ({ id_asignatura: a.id_asignatura, codigo: valor(a) })), retroalimentacion_final: retro })
      setMsg({ tipo: 'ok', texto: 'Calificaciones del cuatrimestre registradas en el formato O.' })
      recargar()
    } catch (e) { setMsg({ tipo: 'error', texto: mensajeError(e) }) }
  }
  return (
    <Card title="Cierre del cuatrimestre — formato O" subtitle="Las calificaciones finales solo se capturan cuando los 3 parciales están evaluados (promedio sugerido).">
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Parciales evaluados: {d.parciales_evaluados} de 3 {cerrado && <Badge tone="green">CERRADO</Badge>}</p>
        <Table rows={d.asignaturas} rowKey={(a) => String(a.id_asignatura)} columns={[
          { header: 'Asignatura', render: (a) => `${a.clave} — ${a.nombre}` }, { header: 'Promedio', render: (a) => a.promedio ?? '—' },
          { header: 'Calificación final', render: (a) => (
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={valor(a)} disabled={!d.puede_cerrar || cerrado} onChange={(e) => setSel({ ...sel, [a.id_asignatura]: e.target.value })}>
              <option value="">Selecciona…</option>{d.escala.map((n) => <option key={n.codigo} value={n.codigo}>{n.codigo} — {n.nombre}</option>)}
            </select>) },
        ]} />
        {!cerrado && d.puede_cerrar && <Campo label="Retroalimentación final del cuatrimestre"><textarea className={inputCls} rows={3} value={retro} onChange={(e) => setRetro(e.target.value)} /></Campo>}
        {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}
        <div className="flex gap-2">
          {!cerrado && <Button disabled={!d.puede_cerrar || d.asignaturas.some((a) => !valor(a))} onClick={guardar}>Registrar calificaciones del cuatrimestre</Button>}
          {idFormatoO && <Link to={`/formato/${idFormatoO}`} className="self-center text-sm text-brand-600 hover:underline">Ver formato O →</Link>}
        </div>
      </div>
    </Card>
  )
}

function Cabecera({ d }: { d: DetalleAsignacion }) {
  return (
    <div>
      <Titulo sub={`Matrícula ${d.matricula} · ${d.programa} (versión ${d.version}) · ${d.empresa} · Cuatrimestre ${d.cuatrimestre}º`}>{d.alumno?.nombre_completo}</Titulo>
      <p className="mt-1 text-xs text-slate-500">Contacto del alumno: {d.alumno?.correo} {d.alumno?.telefono ?? ''} · Materias: {d.asignaturas.map((a) => a.clave).join(', ')}</p>
    </div>
  )
}

export function MentorUeDetallePage() {
  const { id } = useParams()
  const { datos: d, error, cargando, recargar } = useCarga(() => api.get<DetalleAsignacion>(`/asignaciones/${id}`), [id])
  const [abierto, setAbierto] = useState<number | null>(null)
  if (cargando && !d) return <Cargando />
  if (error || !d) return <Alerta>{error}</Alerta>
  const nf = (p: number) => d.formatos.find((f) => f.clave === 'N' && f.parcial === p)
  return (
    <div className="space-y-6">
      <Link to="/mentor-ue" className="text-sm text-brand-600 hover:underline">← Volver a alumnos asignados</Link>
      <Cabecera d={d} />
      <Card title={`Reportes del cuatrimestre en curso: ${d.cuatrimestre}º`}>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((p) => {
            const f = nf(p)
            return (
              <button key={p} type="button" onClick={() => setAbierto(abierto === p ? null : p)} className={`rounded-md border p-3 text-left ${abierto === p ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-brand-400 hover:bg-brand-50'}`}>
                <p className="text-sm font-semibold text-slate-700">Parcial {p}</p>
                <span className="mt-1 flex flex-wrap gap-1"><Badge>{f?.estatus ?? 'BORRADOR'}</Badge><Badge>{f?.estatus_evaluacion ?? 'PENDIENTE'}</Badge></span>
                <p className="mt-2 text-xs font-medium text-brand-600">{abierto === p ? '▾ Ocultar evaluación' : '▸ Ver detalles / evaluar'}</p>
              </button>
            )
          })}
        </div>
        {abierto && <div className="mt-4 border-t border-slate-100 pt-4"><EvaluacionParcial idAsignacion={d.id_asignacion} parcial={abierto} puedeCalificar={d.estatus === 'ACTIVA'} alCambiar={recargar} /></div>}
      </Card>
      <CierreCuatrimestre idAsignacion={d.id_asignacion} idFormatoO={d.formatos.find((f) => f.clave === 'O')?.id_rel} />
      <Card title="Formatos del alumno (consulta)">
        <ul className="flex flex-wrap gap-4 text-sm">
          {d.formatos.filter((f) => ['K', 'L', 'M'].includes(f.clave)).map((f) => <li key={f.id_rel}><Link to={`/formato/${f.id_rel}`} className="text-brand-600 hover:underline">{f.codigo.replace('FOR-GSE-SAC-01-', 'Formato ')} — {f.nombre.split(' de ')[0]}</Link> <Badge>{f.estatus}</Badge></li>)}
        </ul>
      </Card>
    </div>
  )
}

export function MentorAcademicoDetallePage() {
  const { id } = useParams()
  const { datos: d, error, cargando } = useCarga(() => api.get<DetalleAsignacion>(`/asignaciones/${id}`), [id])
  if (cargando) return <Cargando />
  if (error || !d) return <Alerta>{error}</Alerta>
  return (
    <div className="space-y-6">
      <Link to="/mentor-academico" className="text-sm text-brand-600 hover:underline">← Volver a alumnos supervisados</Link>
      <Cabecera d={d} />
      <Alerta tipo="info">Vista de seguimiento (solo lectura). Puedes consultar los formatos y calificaciones de tus alumnos asignados.</Alerta>
      <Card title="Calificaciones por parcial" subtitle="Promedio de actividades evaluadas por el Mentor de la UE">
        <Table rows={d.asignaturas} rowKey={(s) => String(s.id_asignatura)} columns={[
          { header: 'Asignatura', render: (s) => `${s.clave} — ${s.nombre}` },
          ...[1, 2, 3].map((p) => ({ header: `Parcial ${p}`, render: (s: { id_asignatura: number }) => d.calificaciones[p]?.find((x) => x.id_asignatura === s.id_asignatura)?.promedio ?? '—' })),
        ]} />
      </Card>
      <Card title="Historial y formatos de la estancia">
        <Table rows={d.formatos} rowKey={(f) => String(f.id_rel)} columns={[
          { header: 'Formato', render: (f) => `${f.codigo.replace('FOR-GSE-SAC-01-', 'Formato ')}${f.parcial ? ` · P${f.parcial}` : ''}` }, { header: 'Nombre', render: (f) => f.nombre },
          { header: 'Estatus', render: (f) => <Badge>{f.estatus}</Badge> },
          { header: 'Evaluación', render: (f) => (f.clave === 'N' || f.clave === 'O' ? <Badge>{f.estatus_evaluacion}</Badge> : '—') },
          { header: '', render: (f) => <span className="flex gap-3"><Link to={`/formato/${f.id_rel}`} className="text-brand-600 hover:underline">Consultar</Link><Link to={`/formato/${f.id_rel}/imprimir`} target="_blank" className="text-brand-600 hover:underline">Imprimir</Link></span> },
        ]} />
      </Card>
    </div>
  )
}
