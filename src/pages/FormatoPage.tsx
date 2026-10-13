import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { FormatoImprimible } from '../components/FormatoImprimible'
import { Modal } from '../components/Modal'
import { Alerta, Campo, Cargando, Titulo, inputCls, useCarga } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api, mensajeError } from '../lib/api'
import type { Actividad, Imprimible, Puesto } from '../lib/types'

type Contenido = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')

function Calendarizacion({ c, set }: { c: Contenido; set: (k: string, v: unknown) => void }) {
  const dias = Array.isArray(c.calendarizacion) ? (c.calendarizacion as string[]) : []
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-slate-700">Calendarización del seguimiento (día del mes por cada mes de la estancia)</p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i}>
            <span className="block text-center text-xs text-slate-500">Mes {i + 1}</span>
            <input className={inputCls} value={dias[i] ?? ''} onChange={(e) => { const n = Array.from({ length: 12 }, (_, j) => dias[j] ?? ''); n[i] = e.target.value; set('calendarizacion', n) }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ActividadesEditor({ d, recargar }: { d: Imprimible; recargar: () => void }) {
  const parcial = d.formato.parcial
  const acts = d.actividades.filter((a) => a.parcial === parcial)
  const vacio = { id: 0, id_cat_competencia: '', id_asignatura: '', descripcion_actividad: '', entregable: '', horas_dedicacion: '' }
  const [f, setF] = useState(vacio)
  const [error, setError] = useState<string | null>(null)
  const comp = d.competencias.find((c) => String(c.id_cat_competencia) === f.id_cat_competencia)

  const guardar = async () => {
    setError(null)
    try {
      const body = { parcial, id_cat_competencia: Number(f.id_cat_competencia), id_asignatura: Number(f.id_asignatura), descripcion_actividad: f.descripcion_actividad, entregable: f.entregable, horas_dedicacion: f.horas_dedicacion }
      if (f.id) await api.put(`/actividades/${f.id}`, body)
      else await api.post(`/asignaciones/${d.asignacion.id_asignacion}/actividades`, body)
      setF(vacio)
      recargar()
    } catch (e) {
      setError(mensajeError(e))
    }
  }
  const quitar = async (a: Actividad) => {
    try { await api.del(`/actividades/${a.id_actividades}`); recargar() } catch (e) { setError(mensajeError(e)) }
  }
  return (
    <Card title="Actividades realizadas en el parcial" subtitle="Cada actividad se liga a una competencia y a una asignatura de tu estancia; el Mentor de la UE la califica.">
      <div className="space-y-3">
        {acts.length === 0 ? <p className="text-sm text-slate-500">Aún no has registrado actividades en este parcial.</p> : (
          <ul className="space-y-2">
            {acts.map((a) => (
              <li key={a.id_actividades} className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">Competencia {a.no_competencia} · {a.clave_asignatura}</p>
                  <p className="text-slate-600">{a.descripcion_actividad}</p>
                  <p className="text-xs text-slate-500">Evidencia: {a.entregable ?? '—'} · Horas: {a.horas_dedicacion ?? '—'}</p>
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <button type="button" className="text-brand-600 hover:underline" onClick={() => setF({ id: a.id_actividades, id_cat_competencia: String(a.id_cat_competencia), id_asignatura: String(a.id_asignatura), descripcion_actividad: a.descripcion_actividad, entregable: a.entregable ?? '', horas_dedicacion: String(a.horas_dedicacion ?? '') })}>Editar</button>
                  <button type="button" className="text-red-600 hover:underline" onClick={() => quitar(a)}>Quitar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <Campo label="Competencia">
            <select className={inputCls} value={f.id_cat_competencia} onChange={(e) => setF({ ...f, id_cat_competencia: e.target.value, id_asignatura: '' })}>
              <option value="">Selecciona…</option>
              {d.competencias.map((c) => <option key={c.id_cat_competencia} value={c.id_cat_competencia}>Competencia {c.no_competencia} — {c.descripcion_competencia.slice(0, 70)}</option>)}
            </select>
          </Campo>
          <Campo label="Asignatura">
            <select className={inputCls} value={f.id_asignatura} disabled={!comp} onChange={(e) => setF({ ...f, id_asignatura: e.target.value })}>
              <option value="">Selecciona…</option>
              {comp?.asignaturas.map((s) => <option key={s.id_asignatura} value={s.id_asignatura}>{s.clave} — {s.nombre}</option>)}
            </select>
          </Campo>
          <div className="sm:col-span-2"><Campo label="Descripción de la actividad"><textarea className={inputCls} rows={2} value={f.descripcion_actividad} onChange={(e) => setF({ ...f, descripcion_actividad: e.target.value })} /></Campo></div>
          <Campo label="Evidencias o productos"><input className={inputCls} value={f.entregable} onChange={(e) => setF({ ...f, entregable: e.target.value })} /></Campo>
          <Campo label="Horas de dedicación"><input className={inputCls} type="number" min={0} value={f.horas_dedicacion} onChange={(e) => setF({ ...f, horas_dedicacion: e.target.value })} /></Campo>
        </div>
        {error && <Alerta>{error}</Alerta>}
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!f.id_cat_competencia || !f.id_asignatura || !f.descripcion_actividad} onClick={guardar}>{f.id ? 'Guardar actividad' : '+ Agregar actividad'}</Button>
          {f.id !== 0 && <Button variant="ghost" onClick={() => setF(vacio)}>Cancelar edición</Button>}
        </div>
      </div>
    </Card>
  )
}

function PuestosEditor({ d, recargar }: { d: Imprimible; recargar: () => void }) {
  const [edit, setEdit] = useState<Partial<Puesto> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof Puesto) => (e: { target: { value: string } }) => setEdit({ ...edit, [k]: e.target.value })
  const guardar = async () => {
    try {
      if (edit?.id_puesto) await api.put(`/puestos/${edit.id_puesto}`, edit)
      else await api.post(`/asignaciones/${d.asignacion.id_asignacion}/puestos`, { cuatrimestre: d.asignacion.cuatrimestre, ...edit })
      setEdit(null)
      recargar()
    } catch (e) { setError(mensajeError(e)) }
  }
  const campos: [keyof Puesto, string, boolean][] = [['nombre', 'Nombre del puesto', false], ['periodo', 'Periodo de ejecución', false], ['objetivo', 'Objetivo', true], ['requerimientos', 'Requerimientos', true], ['actividades', 'Actividades a desarrollar', true], ['conocimientos_teoricos', 'Conocimientos teóricos', true], ['conocimientos_procedimentales', 'Conocimientos procedimentales', true], ['conocimientos_actitudinales', 'Conocimientos actitudinales', true]]
  return (
    <Card title="Puestos de aprendizaje" actions={<Button variant="secondary" onClick={() => { setError(null); setEdit({}) }}>+ Agregar puesto</Button>}>
      {d.puestos.length === 0 ? <p className="text-sm text-slate-500">Aún no hay puestos registrados.</p> : (
        <ul className="space-y-2">
          {d.puestos.map((p) => (
            <li key={p.id_puesto} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
              <span>{p.nombre} <span className="text-slate-500">· {p.periodo ?? 'sin periodo'}</span></span>
              <span className="flex gap-3 text-xs">
                <button type="button" className="text-brand-600 hover:underline" onClick={() => { setError(null); setEdit(p) }}>Editar</button>
                <button type="button" className="text-red-600 hover:underline" onClick={async () => { await api.del(`/puestos/${p.id_puesto}`); recargar() }}>Quitar</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} title={edit?.id_puesto ? 'Editar puesto' : 'Nuevo puesto'} onClose={() => setEdit(null)} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancelar</Button><Button disabled={!edit?.nombre} onClick={guardar}>Guardar</Button></>}>
        <div className="space-y-3">
          {campos.map(([k, label, largo]) => (
            <Campo key={k} label={label}>{largo ? <textarea className={inputCls} rows={2} value={str(edit?.[k])} onChange={set(k)} /> : <input className={inputCls} value={str(edit?.[k])} onChange={set(k)} />}</Campo>
          ))}
          {error && <Alerta>{error}</Alerta>}
        </div>
      </Modal>
    </Card>
  )
}

function EditorContenido({ d, c, set }: { d: Imprimible; c: Contenido; set: (k: string, v: unknown) => void }) {
  const clave = d.formato.clave
  const campo = (k: string, label: string, tipo: 'text' | 'date' | 'number' | 'area' = 'text') => (
    <Campo label={label}>
      {tipo === 'area' ? <textarea className={inputCls} rows={4} value={str(c[k])} onChange={(e) => set(k, e.target.value)} /> : <input className={inputCls} type={tipo} value={str(c[k])} onChange={(e) => set(k, e.target.value)} />}
    </Campo>
  )
  const ev = Array.isArray(c.evidencia_grafica) ? (c.evidencia_grafica as string[]) : []
  if (clave === 'N')
    return (
      <Card title="Datos del reporte">
        <div className="grid gap-3 sm:grid-cols-3">
          {campo('numero_reporte', 'Número de reporte', 'number')}{campo('periodo_inicio', 'Periodo — inicio', 'date')}{campo('periodo_fin', 'Periodo — fin', 'date')}
          {campo('fecha_elaboracion', 'Fecha de elaboración', 'date')}
          <div className="sm:col-span-2">{campo('nombre_proyecto', 'Nombre del proyecto o Plan de Rotación')}</div>
          <div className="sm:col-span-3">{campo('marco_teorico', 'Marco teórico o antecedentes', 'area')}</div>
          <div className="sm:col-span-3">{campo('descripcion_actividades', 'Descripción de las actividades realizadas', 'area')}</div>
          {[0, 1].map((i) => (
            <div key={i} className="sm:col-span-3">
              <Campo label={`Evidencia gráfica ${i + 1} (URL de la imagen${i ? ', opcional' : ''})`}>
                <input className={inputCls} value={ev[i] ?? ''} onChange={(e) => { const n = [ev[0] ?? '', ev[1] ?? '']; n[i] = e.target.value; set('evidencia_grafica', n) }} />
              </Campo>
            </div>
          ))}
        </div>
      </Card>
    )
  if (clave === 'K')
    return (
      <Card title="Datos del Plan de Formación">
        <div className="grid gap-3 sm:grid-cols-2">
          {campo('duracion_periodos', 'Duración del plan (en periodos)')}{campo('horas_semana', 'Número de horas a la semana en la UE', 'number')}
          <div className="sm:col-span-2">{campo('descripcion_proyecto', 'Descripción del proyecto (¿qué?, ¿cómo?, ¿dónde?, ¿cuándo?, ¿para qué?)', 'area')}</div>
          <div className="sm:col-span-2"><Calendarizacion c={c} set={set} /></div>
        </div>
      </Card>
    )
  if (clave === 'L')
    return (
      <Card title="Datos del Plan de Rotación">
        <div className="grid gap-3 sm:grid-cols-2">
          {campo('nombre_plan', 'Nombre del Plan de Rotación')}{campo('duracion_total', 'Duración total del programa')}
          <div className="sm:col-span-2">{campo('descripcion_plan', 'Descripción del Plan de Rotación', 'area')}</div>
        </div>
        <p className="mt-2 text-xs text-slate-500">Los puestos de aprendizaje del listado se capturan en el formato M.</p>
      </Card>
    )
  if (clave === 'O')
    return (
      <Card title="Datos del seguimiento y evaluación">
        <div className="space-y-3">
          {campo('descripcion_proyecto', 'Descripción del proyecto', 'area')}
          <Calendarizacion c={c} set={set} />
          <p className="text-xs text-slate-500">Las calificaciones finales y la retroalimentación las captura el Mentor de la UE al cierre del cuatrimestre.</p>
        </div>
      </Card>
    )
  return null
}

export function FormatoPage() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { datos: d, error, cargando, recargar } = useCarga(() => api.get<Imprimible>(`/formatos/${id}/imprimible`), [id])
  const [c, setC] = useState<Contenido>({})
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [obs, setObs] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { if (d) setC(d.formato.contenido) }, [d])
  if (cargando && !d) return <Cargando />
  if (error || !d || !usuario) return <Alerta>{error ?? 'Formato no disponible'}</Alerta>

  const f = d.formato
  const editable = usuario.rol === 'ALUMNO' && ['BORRADOR', 'RECHAZADO'].includes(f.estatus) && f.estatus_evaluacion !== 'EVALUADO'
  const set = (k: string, v: unknown) => setC((prev) => ({ ...prev, [k]: v }))
  const accion = async (fn: () => Promise<unknown>, ok: string) => {
    setGuardando(true)
    setMsg(null)
    try { await fn(); setMsg({ tipo: 'ok', texto: ok }); await recargar() } catch (e) { setMsg({ tipo: 'error', texto: mensajeError(e) }) } finally { setGuardando(false) }
  }
  const sinContenidoPropio = f.clave === 'M'

  return (
    <div className="space-y-5">
      <div className="no-print"><button type="button" onClick={() => navigate(-1)} className="text-sm text-brand-600 hover:underline">← Volver</button></div>
      <Titulo
        sub={`${f.codigo}${f.parcial ? ` · Parcial ${f.parcial}` : ''} · ${d.asignacion.alumno?.nombre_completo ?? ''}`}
        acciones={<Link to={`/formato/${f.id_rel}/imprimir`} target="_blank" className="text-sm font-medium text-brand-600 hover:underline">Imprimir / guardar PDF</Link>}
      >{f.nombre}</Titulo>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Estatus:</span><Badge>{f.estatus}</Badge>
        {f.clave === 'N' && <><span className="ml-3">Evaluación:</span><Badge>{f.estatus_evaluacion}</Badge></>}
      </div>
      {f.estatus === 'RECHAZADO' && f.observaciones && <Alerta tipo="aviso"><strong>El Enlace de Educación Dual rechazó el formato.</strong> Indicaciones: {f.observaciones}</Alerta>}
      {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}

      {editable && (
        <div className="no-print space-y-4">
          <Alerta tipo="info">Puedes capturar y editar este formato. Al terminar, envíalo a revisión del Enlace de Educación Dual y del Mentor de la Unidad Económica.</Alerta>
          {!sinContenidoPropio && <EditorContenido d={d} c={c} set={set} />}
          {f.clave === 'N' && <ActividadesEditor d={d} recargar={recargar} />}
          {f.clave === 'M' && <PuestosEditor d={d} recargar={recargar} />}
          <div className="flex gap-2">
            {!sinContenidoPropio && <Button variant="secondary" disabled={guardando} onClick={() => accion(() => api.put(`/formatos/${f.id_rel}`, { contenido: c }), 'Cambios guardados.')}>Guardar borrador</Button>}
            <Button disabled={guardando} onClick={() => accion(async () => { if (!sinContenidoPropio) await api.put(`/formatos/${f.id_rel}`, { contenido: c }); await api.post(`/formatos/${f.id_rel}/enviar`) }, 'Formato enviado a revisión.')}>Enviar a revisión</Button>
          </div>
        </div>
      )}

      {usuario.rol === 'ENLACE_DUAL' && f.estatus === 'EN_REVISION' && (
        <Card title="Revisión del Enlace de Educación Dual" className="no-print">
          <div className="space-y-3">
            <Campo label="Observaciones (obligatorias si se rechaza)"><textarea className={inputCls} rows={3} value={obs} onChange={(e) => setObs(e.target.value)} /></Campo>
            <div className="flex gap-2">
              <Button disabled={guardando} onClick={() => accion(() => api.put(`/formatos/${f.id_rel}/revisar`, { decision: 'ACEPTADO', observaciones: obs || undefined }), 'Formato aceptado.')}>Aceptar</Button>
              <Button variant="danger" disabled={guardando || !obs.trim()} onClick={() => accion(() => api.put(`/formatos/${f.id_rel}/revisar`, { decision: 'RECHAZADO', observaciones: obs }), 'Formato rechazado; el alumno podrá editarlo.')}>Rechazar</Button>
            </div>
          </div>
        </Card>
      )}

      <FormatoImprimible data={{ ...d, formato: { ...d.formato, contenido: editable ? c : d.formato.contenido } }} />
    </div>
  )
}

export function ImprimirFormatoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { datos: d, error, cargando } = useCarga(() => api.get<Imprimible>(`/formatos/${id}/imprimible`), [id])
  if (cargando) return <p className="p-6 text-sm text-slate-500">Cargando…</p>
  if (error || !d) return <p className="p-6 text-sm text-red-600">{error ?? 'Formato no encontrado'}</p>
  return (
    <div className="min-h-screen bg-slate-200 py-6">
      <div className="no-print mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-between px-2">
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-brand-600 hover:underline">← Volver</button>
        <Button onClick={() => window.print()}>Imprimir / Guardar como PDF</Button>
      </div>
      <FormatoImprimible data={d} />
    </div>
  )
}
