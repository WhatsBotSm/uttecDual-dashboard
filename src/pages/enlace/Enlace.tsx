import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Modal } from '../../components/Modal'
import { Table } from '../../components/Table'
import { Alerta, Campo, Cargando, Titulo, fechaCorta, inputCls, useCarga } from '../../components/ui'
import { api, mensajeError } from '../../lib/api'
import type { AsignacionResumen, FormatoItem } from '../../lib/types'

// ---------------- Dashboard ----------------
interface Dash { alumnos_sin_asignar: number; empresas_con_cupo: number; formatos_en_revision: number; solicitudes_abiertas: number; evaluaciones_total: number; evaluaciones_completadas: number }
export function EnlaceDashboardPage() {
  const { datos: d, error, cargando } = useCarga(() => api.get<Dash>('/enlace/dashboard'))
  if (cargando) return <Cargando />
  if (error || !d) return <Alerta>{error}</Alerta>
  const pct = d.evaluaciones_total ? Math.round((d.evaluaciones_completadas / d.evaluaciones_total) * 100) : 0
  const tarjetas: [string, number, string, string][] = [
    ['Alumnos sin asignar', d.alumnos_sin_asignar, '/enlace/asignaciones', 'Asignar'],
    ['Unidades económicas con cupo', d.empresas_con_cupo, '/enlace/empresas', 'Ver'],
    ['Solicitudes abiertas', d.solicitudes_abiertas, '/enlace/solicitudes', 'Gestionar'],
    ['Formatos por revisar', d.formatos_en_revision, '/enlace/revision', 'Revisar'],
  ]
  return (
    <div className="space-y-6">
      <Titulo sub="Alumnos sin asignar, unidades con cupo y avance de evaluaciones del cuatrimestre activo">Panel principal</Titulo>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map(([t, n, to, l]) => (
          <Card key={t} title={t}><p className="text-3xl font-semibold text-slate-900">{n}</p><Link to={to} className="text-sm text-brand-600 hover:underline">{l} →</Link></Card>
        ))}
      </div>
      <Card title="Avance de evaluaciones (reportes por parcial)">
        <p className="text-3xl font-semibold text-slate-900">{pct}%</p>
        <p className="text-sm text-slate-500">{d.evaluaciones_completadas} de {d.evaluaciones_total} evaluaciones cerradas</p>
      </Card>
    </div>
  )
}

// ---------------- Revisión de formatos ----------------
interface ItemRev extends FormatoItem { id_asignacion: number; asignacion?: AsignacionResumen }
export function EnlaceRevisionPage() {
  const [est, setEst] = useState('EN_REVISION')
  const { datos, error, cargando } = useCarga(() => api.get<ItemRev[]>(`/revision?estatus=${est}`), [est])
  return (
    <div className="space-y-6">
      <Titulo sub="Revisa y evalúa los formatos K, L, M, Ñ y O trabajados por los alumnos en la App.">Revisión de formatos</Titulo>
      <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={est} onChange={(e) => setEst(e.target.value)}>
        <option value="EN_REVISION">En revisión</option><option value="RECHAZADO">Rechazados</option><option value="ACEPTADO">Aceptados</option><option value="BORRADOR">Borradores</option>
      </select>
      {error && <Alerta>{error}</Alerta>}
      <Card>
        {cargando ? <Cargando /> : (
          <Table rows={datos ?? []} rowKey={(f) => String(f.id_rel)} emptyMessage="No hay formatos con ese estatus." columns={[
            { header: 'Alumno', render: (f) => f.asignacion?.alumno?.nombre_completo ?? '—' },
            { header: 'Formato', render: (f) => `${f.codigo.replace('FOR-GSE-SAC-01-', 'Formato ')}${f.parcial ? ` · P${f.parcial}` : ''}` },
            { header: 'Unidad económica', render: (f) => f.asignacion?.empresa ?? '' },
            { header: 'Enviado', render: (f) => fechaCorta(f.fecha_envio) }, { header: 'Estatus', render: (f) => <Badge>{f.estatus}</Badge> },
            { header: '', render: (f) => <Link to={`/formato/${f.id_rel}`} className="text-brand-600 hover:underline">Abrir y revisar →</Link> },
          ]} />
        )}
      </Card>
    </div>
  )
}

// ---------------- Solicitudes ----------------
interface Sol { id_solicitud: number; estatus: string; empresa: string; nombre_proyecto: string | null; matricula: string; nombre_carrera: string; fecha_solicitud: string; alumno: { nombre_completo: string } | null }
export function EnlaceSolicitudesPage() {
  const [est, setEst] = useState('')
  const { datos, error, cargando, recargar } = useCarga(() => api.get<Sol[]>(`/enlace/solicitudes${est ? `?estatus=${est}` : ''}`), [est])
  const [msg, setMsg] = useState<string | null>(null)
  const cambiar = async (id: number, estatus: string) => {
    try { await api.put(`/enlace/solicitudes/${id}`, { estatus }); recargar() } catch (e) { setMsg(mensajeError(e)) }
  }
  return (
    <div className="space-y-6">
      <Titulo sub="Da seguimiento a las solicitudes de interés de los alumnos y cambia su estatus.">Solicitudes de interés</Titulo>
      <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={est} onChange={(e) => setEst(e.target.value)}>
        <option value="">Todas</option>{['PENDIENTE', 'EN_PROCESO', 'ACEPTADA', 'RECHAZADA', 'CANCELADA'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>
      {(error || msg) && <Alerta>{error ?? msg}</Alerta>}
      <Card>{cargando ? <Cargando /> : (
        <Table rows={datos ?? []} rowKey={(s) => String(s.id_solicitud)} emptyMessage="Sin solicitudes." columns={[
          { header: 'Alumno', render: (s) => `${s.alumno?.nombre_completo ?? ''} (${s.matricula})` }, { header: 'Programa', render: (s) => s.nombre_carrera },
          { header: 'Unidad económica', render: (s) => s.empresa }, { header: 'Iniciativa', render: (s) => s.nombre_proyecto ?? '—' }, { header: 'Fecha', render: (s) => fechaCorta(s.fecha_solicitud) },
          { header: 'Estatus', render: (s) => (
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={s.estatus} onChange={(e) => cambiar(s.id_solicitud, e.target.value)}>
              {['PENDIENTE', 'EN_PROCESO', 'ACEPTADA', 'RECHAZADA', 'CANCELADA'].map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}
            </select>) },
        ]} />)}</Card>
    </div>
  )
}

// ---------------- Asignaciones ----------------
interface SinAsignar { id_alumno: number; matricula: string; cuatrimestre_actual: number; id_cat_programa_educativo: number; nombre_carrera: string; version: string; empresa_solicitada: number | null; alumno: { nombre_completo: string } | null }
interface EmpresaLite { id_empresa: number; razon_social: string; cupo_actual: number; activo: boolean; iniciativas: { id_iniciativa_empresa: number; nombre_proyecto: string }[] }
interface MentorLite { id_personal_dual: number; tipo: string; id_empresa: number | null; nombre_completo: string }
interface AsigLite { id_asignatura: number; clave: string; nombre: string; ubicacion: string | null }

export function EnlaceAsignacionesPage() {
  const asigs = useCarga(() => api.get<AsignacionResumen[]>('/enlace/asignaciones'))
  const sin = useCarga(() => api.get<SinAsignar[]>('/enlace/alumnos-sin-asignar'))
  const emps = useCarga(() => api.get<EmpresaLite[]>('/enlace/empresas'))
  const mentores = useCarga(() => api.get<MentorLite[]>('/enlace/mentores'))
  const [modal, setModal] = useState<SinAsignar | null>(null)
  const [materias, setMaterias] = useState<AsigLite[]>([])
  const [f, setF] = useState({ id_empresa: '', id_iniciativa_empresa: '', id_mentor_ue: '', id_personal_dual: '', cuatrimestre: '', duracion_estancia_dual: '4', dias_asistencia: 'Lunes a viernes', horario: '', ids: [] as number[] })
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const abrir = async (a: SinAsignar) => {
    setErr(null)
    const todas = await api.get<AsigLite[]>(`/enlace/asignaturas?programa=${a.id_cat_programa_educativo}`)
    const delCuatri = todas.filter((m) => m.ubicacion === String(a.cuatrimestre_actual))
    setMaterias(todas)
    setF({ id_empresa: a.empresa_solicitada ? String(a.empresa_solicitada) : '', id_iniciativa_empresa: '', id_mentor_ue: '', id_personal_dual: '', cuatrimestre: String(a.cuatrimestre_actual), duracion_estancia_dual: '4', dias_asistencia: 'Lunes a viernes', horario: '', ids: delCuatri.map((m) => m.id_asignatura) })
    setModal(a)
  }
  const emp = emps.datos?.find((e) => String(e.id_empresa) === f.id_empresa)
  const crear = async () => {
    try {
      await api.post('/enlace/asignaciones', { id_alumno: modal?.id_alumno, id_empresa: Number(f.id_empresa), id_iniciativa_empresa: f.id_iniciativa_empresa ? Number(f.id_iniciativa_empresa) : undefined, id_mentor_ue: f.id_mentor_ue ? Number(f.id_mentor_ue) : undefined, id_personal_dual: f.id_personal_dual ? Number(f.id_personal_dual) : undefined, cuatrimestre: Number(f.cuatrimestre), duracion_estancia_dual: Number(f.duracion_estancia_dual), dias_asistencia: f.dias_asistencia, horario: f.horario, ids_asignaturas: f.ids })
      setModal(null)
      setMsg('Asignación creada: se generaron los formatos K, L, M, O y las 3 evaluaciones (reportes Ñ) del cuatrimestre.')
      asigs.recargar(); sin.recargar(); emps.recargar()
    } catch (e) { setErr(mensajeError(e)) }
  }
  const mentorAc = async (a: AsignacionResumen, id: string) => { try { await api.put(`/enlace/asignaciones/${a.id_asignacion}/mentores`, { id_personal_dual: Number(id) }); asigs.recargar() } catch (e) { setMsg(mensajeError(e)) } }
  const mentorUe = async (a: AsignacionResumen, id: string) => { try { await api.put(`/enlace/asignaciones/${a.id_asignacion}/mentores`, { id_mentor_ue: Number(id) }); asigs.recargar() } catch (e) { setMsg(mensajeError(e)) } }
  const estatus = async (a: AsignacionResumen, e: string) => { try { await api.put(`/enlace/asignaciones/${a.id_asignacion}/estatus`, { estatus: e }); asigs.recargar(); emps.recargar() } catch (er) { setMsg(mensajeError(er)) } }

  return (
    <div className="space-y-6">
      <Titulo sub="Asigna formalmente alumno, unidad económica, mentores y materias de la estancia.">Asignaciones</Titulo>
      {msg && <Alerta tipo="info">{msg}</Alerta>}
      <Card title="Alumnos sin asignar">
        <Table rows={sin.datos ?? []} rowKey={(a) => String(a.id_alumno)} emptyMessage="Todos los alumnos activos están asignados." columns={[
          { header: 'Alumno', render: (a) => a.alumno?.nombre_completo ?? '' }, { header: 'Matrícula', render: (a) => a.matricula }, { header: 'Programa', render: (a) => `${a.nombre_carrera} (v${a.version})` }, { header: 'Cuatrimestre', render: (a) => `${a.cuatrimestre_actual}º` },
          { header: 'Solicitud', render: (a) => (a.empresa_solicitada ? emps.datos?.find((e) => e.id_empresa === a.empresa_solicitada)?.razon_social : '—') },
          { header: '', render: (a) => <Button variant="secondary" onClick={() => abrir(a)}>Asignar</Button> },
        ]} />
      </Card>
      <Card title="Asignaciones">
        <Table rows={asigs.datos ?? []} rowKey={(a) => String(a.id_asignacion)} columns={[
          { header: 'Alumno', render: (a) => `${a.alumno?.nombre_completo} (${a.matricula})` }, { header: 'Unidad económica', render: (a) => a.empresa }, { header: 'Cuatri.', render: (a) => `${a.cuatrimestre}º` },
          { header: 'Mentor UE', render: (a) => (
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={a.id_mentor_ue ?? ''} onChange={(e) => mentorUe(a, e.target.value)}>
              <option value="" disabled>Sin asignar</option>{mentores.datos?.filter((m) => m.tipo === 'MENTOR_UE' && m.id_empresa === a.id_empresa).map((m) => <option key={m.id_personal_dual} value={m.id_personal_dual}>{m.nombre_completo}</option>)}
            </select>) },
          { header: 'Mentor Académico', render: (a) => (
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={a.id_personal_dual ?? ''} onChange={(e) => mentorAc(a, e.target.value)}>
              <option value="" disabled>Sin asignar</option>{mentores.datos?.filter((m) => m.tipo === 'MENTOR_ACADEMICO').map((m) => <option key={m.id_personal_dual} value={m.id_personal_dual}>{m.nombre_completo}</option>)}
            </select>) },
          { header: 'Estatus', render: (a) => (
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={a.estatus} onChange={(e) => estatus(a, e.target.value)}>
              {['ACTIVA', 'FINALIZADA', 'CANCELADA'].map((s) => <option key={s}>{s}</option>)}
            </select>) },
        ]} />
      </Card>
      <Modal open={!!modal} title={`Asignar a ${modal?.alumno?.nombre_completo ?? ''}`} onClose={() => setModal(null)} footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button><Button disabled={!f.id_empresa || f.ids.length === 0} onClick={crear}>Crear asignación</Button></>}>
        <div className="space-y-3">
          <Campo label="Unidad económica">
            <select className={inputCls} value={f.id_empresa} onChange={(e) => setF({ ...f, id_empresa: e.target.value, id_iniciativa_empresa: '', id_mentor_ue: '' })}>
              <option value="">Selecciona…</option>{emps.datos?.filter((e) => e.activo).map((e) => <option key={e.id_empresa} value={e.id_empresa}>{e.razon_social} (cupo {e.cupo_actual})</option>)}
            </select>
          </Campo>
          <Campo label="Iniciativa / proyecto"><select className={inputCls} value={f.id_iniciativa_empresa} onChange={(e) => setF({ ...f, id_iniciativa_empresa: e.target.value })}><option value="">Sin iniciativa</option>{emp?.iniciativas.map((i) => <option key={i.id_iniciativa_empresa} value={i.id_iniciativa_empresa}>{i.nombre_proyecto}</option>)}</select></Campo>
          <Campo label="Mentor de la UE"><select className={inputCls} value={f.id_mentor_ue} onChange={(e) => setF({ ...f, id_mentor_ue: e.target.value })}><option value="">Por asignar</option>{mentores.datos?.filter((m) => m.tipo === 'MENTOR_UE' && String(m.id_empresa) === f.id_empresa).map((m) => <option key={m.id_personal_dual} value={m.id_personal_dual}>{m.nombre_completo}</option>)}</select></Campo>
          <Campo label="Mentor Académico"><select className={inputCls} value={f.id_personal_dual} onChange={(e) => setF({ ...f, id_personal_dual: e.target.value })}><option value="">Por asignar</option>{mentores.datos?.filter((m) => m.tipo === 'MENTOR_ACADEMICO').map((m) => <option key={m.id_personal_dual} value={m.id_personal_dual}>{m.nombre_completo}</option>)}</select></Campo>
          <div className="grid grid-cols-3 gap-3">
            <Campo label="Cuatrimestre"><input className={inputCls} type="number" value={f.cuatrimestre} onChange={(e) => setF({ ...f, cuatrimestre: e.target.value })} /></Campo>
            <Campo label="Duración (meses)"><input className={inputCls} type="number" value={f.duracion_estancia_dual} onChange={(e) => setF({ ...f, duracion_estancia_dual: e.target.value })} /></Campo>
            <Campo label="Horario"><input className={inputCls} value={f.horario} onChange={(e) => setF({ ...f, horario: e.target.value })} /></Campo>
          </div>
          <Campo label="Días de asistencia"><input className={inputCls} value={f.dias_asistencia} onChange={(e) => setF({ ...f, dias_asistencia: e.target.value })} /></Campo>
          <Campo label="Materias de la estancia" ayuda="Se preseleccionan las del cuatrimestre del alumno.">
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {materias.map((m) => (
                <label key={m.id_asignatura} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.ids.includes(m.id_asignatura)} onChange={() => setF({ ...f, ids: f.ids.includes(m.id_asignatura) ? f.ids.filter((x) => x !== m.id_asignatura) : [...f.ids, m.id_asignatura] })} />{m.clave} — {m.nombre} <span className="text-xs text-slate-400">({m.ubicacion}º)</span></label>
              ))}
            </div>
          </Campo>
          {err && <Alerta>{err}</Alerta>}
        </div>
      </Modal>
    </div>
  )
}

// ---------------- Unidades económicas ----------------
interface Empresa { id_empresa: number; razon_social: string; direccion: string | null; telefono: string | null; cupo_total_alumno: number; cupo_actual: number; apoyos: string | null; horarios: string | null; monto: string | null; activo: boolean; iniciativas: Iniciativa[] }
interface Iniciativa { id_iniciativa_empresa: number; nombre_proyecto: string; descripcion: string | null; cupo_por_iniciativa: number; objetivo_proyecto: string | null; duracion: string | null; fecha_inicio: string | null; fecha_fin: string | null }
export function EnlaceEmpresasPage() {
  const { datos, error, cargando, recargar } = useCarga(() => api.get<Empresa[]>('/enlace/empresas'))
  const [e, setE] = useState<Partial<Empresa> | null>(null)
  const [ini, setIni] = useState<{ idEmpresa: number; v: Partial<Iniciativa> } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const s = (k: keyof Empresa) => (ev: { target: { value: string } }) => setE({ ...e, [k]: ev.target.value })
  const guardar = async () => {
    try { if (e?.id_empresa) await api.put(`/enlace/empresas/${e.id_empresa}`, e); else await api.post('/enlace/empresas', e); setE(null); recargar() } catch (x) { setErr(mensajeError(x)) }
  }
  const guardarIni = async () => {
    if (!ini) return
    try { if (ini.v.id_iniciativa_empresa) await api.put(`/enlace/iniciativas/${ini.v.id_iniciativa_empresa}`, ini.v); else await api.post(`/enlace/empresas/${ini.idEmpresa}/iniciativas`, ini.v); setIni(null); recargar() } catch (x) { setErr(mensajeError(x)) }
  }
  return (
    <div className="space-y-6">
      <Titulo acciones={<Button onClick={() => { setErr(null); setE({ cupo_total_alumno: 1 }) }}>+ Nueva unidad económica</Button>}>Unidades económicas</Titulo>
      {error && <Alerta>{error}</Alerta>}
      {cargando ? <Cargando /> : datos?.map((x) => (
        <Card key={x.id_empresa} title={x.razon_social} actions={<div className="flex items-center gap-3"><Badge tone={x.activo ? 'green' : 'red'}>{x.activo ? 'ACTIVA' : 'INACTIVA'}</Badge><button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => { setErr(null); setE(x) }}>Editar</button></div>}>
          <p className="text-sm text-slate-600">{x.direccion} · {x.telefono} · Horario: {x.horarios ?? '—'} · Apoyos: {x.apoyos ?? '—'} · Monto: {x.monto ? `$${x.monto}` : '—'}</p>
          <p className="mt-1 text-sm">Cupo: <strong>{x.cupo_actual}</strong> disponible de {x.cupo_total_alumno}</p>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="mb-1 flex items-center justify-between"><p className="text-sm font-semibold text-slate-700">Iniciativas / proyectos</p><button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => { setErr(null); setIni({ idEmpresa: x.id_empresa, v: { cupo_por_iniciativa: 1 } }) }}>+ Agregar</button></div>
            <ul className="space-y-1 text-sm">{x.iniciativas.map((i) => (
              <li key={i.id_iniciativa_empresa} className="flex justify-between"><span>{i.nombre_proyecto} <span className="text-slate-400">(cupo {i.cupo_por_iniciativa})</span></span>
                <span className="flex gap-3"><button type="button" className="text-brand-600 hover:underline" onClick={() => { setErr(null); setIni({ idEmpresa: x.id_empresa, v: i }) }}>Editar</button>
                  <button type="button" className="text-red-600 hover:underline" onClick={async () => { try { await api.del(`/enlace/iniciativas/${i.id_iniciativa_empresa}`); recargar() } catch (z) { setErr(mensajeError(z)) } }}>Eliminar</button></span></li>))}</ul>
          </div>
        </Card>
      ))}
      <Modal open={!!e} title={e?.id_empresa ? 'Editar unidad económica' : 'Nueva unidad económica'} onClose={() => setE(null)} footer={<><Button variant="ghost" onClick={() => setE(null)}>Cancelar</Button><Button disabled={!e?.razon_social} onClick={guardar}>Guardar</Button></>}>
        <div className="space-y-3">
          <Campo label="Razón social"><input className={inputCls} value={e?.razon_social ?? ''} onChange={s('razon_social')} /></Campo>
          <Campo label="Dirección"><input className={inputCls} value={e?.direccion ?? ''} onChange={s('direccion')} /></Campo>
          <div className="grid grid-cols-2 gap-3"><Campo label="Teléfono"><input className={inputCls} value={e?.telefono ?? ''} onChange={s('telefono')} /></Campo><Campo label="Cupo total de alumnos"><input className={inputCls} type="number" min={0} value={e?.cupo_total_alumno ?? 0} onChange={s('cupo_total_alumno')} /></Campo></div>
          <div className="grid grid-cols-2 gap-3"><Campo label="Horarios"><input className={inputCls} value={e?.horarios ?? ''} onChange={s('horarios')} /></Campo><Campo label="Monto del apoyo"><input className={inputCls} type="number" value={e?.monto ?? ''} onChange={s('monto')} /></Campo></div>
          <Campo label="Apoyos"><input className={inputCls} value={e?.apoyos ?? ''} onChange={s('apoyos')} /></Campo>
          {e?.id_empresa && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.activo ?? true} onChange={(ev) => setE({ ...e, activo: ev.target.checked })} />Activa</label>}
          {err && <Alerta>{err}</Alerta>}
        </div>
      </Modal>
      <Modal open={!!ini} title={ini?.v.id_iniciativa_empresa ? 'Editar iniciativa' : 'Nueva iniciativa'} onClose={() => setIni(null)} footer={<><Button variant="ghost" onClick={() => setIni(null)}>Cancelar</Button><Button disabled={!ini?.v.nombre_proyecto} onClick={guardarIni}>Guardar</Button></>}>
        {ini && (
          <div className="space-y-3">
            <Campo label="Nombre del proyecto"><input className={inputCls} value={ini.v.nombre_proyecto ?? ''} onChange={(ev) => setIni({ ...ini, v: { ...ini.v, nombre_proyecto: ev.target.value } })} /></Campo>
            <Campo label="Descripción"><textarea className={inputCls} rows={2} value={ini.v.descripcion ?? ''} onChange={(ev) => setIni({ ...ini, v: { ...ini.v, descripcion: ev.target.value } })} /></Campo>
            <Campo label="Objetivo del proyecto"><textarea className={inputCls} rows={2} value={ini.v.objetivo_proyecto ?? ''} onChange={(ev) => setIni({ ...ini, v: { ...ini.v, objetivo_proyecto: ev.target.value } })} /></Campo>
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Cupo"><input className={inputCls} type="number" min={1} value={ini.v.cupo_por_iniciativa ?? 1} onChange={(ev) => setIni({ ...ini, v: { ...ini.v, cupo_por_iniciativa: Number(ev.target.value) } })} /></Campo>
              <Campo label="Inicio"><input className={inputCls} type="date" value={(ini.v.fecha_inicio ?? '').slice(0, 10)} onChange={(ev) => setIni({ ...ini, v: { ...ini.v, fecha_inicio: ev.target.value } })} /></Campo>
              <Campo label="Fin"><input className={inputCls} type="date" value={(ini.v.fecha_fin ?? '').slice(0, 10)} onChange={(ev) => setIni({ ...ini, v: { ...ini.v, fecha_fin: ev.target.value } })} /></Campo>
            </div>
            <Campo label="Duración"><input className={inputCls} value={ini.v.duracion ?? ''} onChange={(ev) => setIni({ ...ini, v: { ...ini.v, duracion: ev.target.value } })} /></Campo>
            {err && <Alerta>{err}</Alerta>}
          </div>
        )}
      </Modal>
    </div>
  )
}
