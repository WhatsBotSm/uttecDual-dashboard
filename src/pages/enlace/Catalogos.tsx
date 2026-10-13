import { useEffect, useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Modal } from '../../components/Modal'
import { Table } from '../../components/Table'
import { Alerta, Campo, Cargando, Titulo, inputCls, useCarga } from '../../components/ui'
import { api, mensajeError } from '../../lib/api'

interface Programa { id_cat_programa_educativo: number; division: string; nombre_carrera: string; duracion: number; version: '2020' | '2024'; activo: boolean }
interface Asig { id_asignatura: number; nombre: string; clave: string; descripcion: string | null; horas_totales: number | null; ubicacion: string | null; optativa: boolean; id_cat_programa_educativo: number }

function SelectorPrograma({ programas, valor, onChange }: { programas: Programa[]; valor: string; onChange: (v: string) => void }) {
  return (
    <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={valor} onChange={(e) => onChange(e.target.value)}>
      {programas.map((p) => <option key={p.id_cat_programa_educativo} value={p.id_cat_programa_educativo}>{p.nombre_carrera} (v{p.version})</option>)}
    </select>
  )
}
function useProgramas() {
  const progs = useCarga(() => api.get<Programa[]>('/enlace/programas'))
  const [sel, setSel] = useState('')
  useEffect(() => { if (progs.datos?.length && !sel) setSel(String(progs.datos[0].id_cat_programa_educativo)) }, [progs.datos, sel])
  return { progs, sel, setSel }
}

// ---------------- Programas educativos + asignaturas ----------------
export function EnlaceProgramasPage() {
  const { progs, sel, setSel } = useProgramas()
  const asigs = useCarga(() => (sel ? api.get<Asig[]>(`/enlace/asignaturas?programa=${sel}`) : Promise.resolve([])), [sel])
  const [p, setP] = useState<Partial<Programa> | null>(null)
  const [a, setA] = useState<Partial<Asig> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const guardarP = async () => {
    try { if (p?.id_cat_programa_educativo) await api.put(`/enlace/programas/${p.id_cat_programa_educativo}`, p); else await api.post('/enlace/programas', p); setP(null); progs.recargar() } catch (e) { setErr(mensajeError(e)) }
  }
  const guardarA = async () => {
    try { if (a?.id_asignatura) await api.put(`/enlace/asignaturas/${a.id_asignatura}`, a); else await api.post('/enlace/asignaturas', { ...a, id_cat_programa_educativo: Number(sel) }); setA(null); asigs.recargar() } catch (e) { setErr(mensajeError(e)) }
  }
  if (progs.cargando) return <Cargando />
  return (
    <div className="space-y-6">
      <Titulo sub="La versión del programa (2020 o 2024) define la escala de evaluación que usa el Mentor de la UE." acciones={<Button onClick={() => { setErr(null); setP({ version: '2024', duracion: 6 }) }}>+ Nuevo programa</Button>}>Programas educativos y asignaturas</Titulo>
      <Card title="Programas educativos">
        <Table rows={progs.datos ?? []} rowKey={(x) => String(x.id_cat_programa_educativo)} columns={[
          { header: 'Carrera', render: (x) => x.nombre_carrera }, { header: 'División', render: (x) => x.division }, { header: 'Duración', render: (x) => `${x.duracion} cuatrimestres` },
          { header: 'Versión', render: (x) => <Badge tone={x.version === '2024' ? 'purple' : 'blue'}>{`v${x.version}`}</Badge> }, { header: 'Estatus', render: (x) => <Badge tone={x.activo ? 'green' : 'red'}>{x.activo ? 'ACTIVO' : 'INACTIVO'}</Badge> },
          { header: '', render: (x) => <button type="button" className="text-brand-600 hover:underline" onClick={() => { setErr(null); setP(x) }}>Editar</button> },
        ]} />
      </Card>
      <Card title="Asignaturas" actions={<div className="flex items-center gap-2"><SelectorPrograma programas={progs.datos ?? []} valor={sel} onChange={setSel} /><Button variant="secondary" onClick={() => { setErr(null); setA({}) }}>+ Nueva asignatura</Button></div>}>
        <Table rows={asigs.datos ?? []} rowKey={(x) => String(x.id_asignatura)} emptyMessage="Este programa aún no tiene asignaturas." columns={[
          { header: 'Clave', render: (x) => x.clave }, { header: 'Asignatura', render: (x) => x.nombre }, { header: 'Cuatrimestre', render: (x) => x.ubicacion ?? '—' }, { header: 'Horas', render: (x) => x.horas_totales ?? '—' },
          { header: 'Optativa', render: (x) => (x.optativa ? 'Sí' : 'No') }, { header: '', render: (x) => <button type="button" className="text-brand-600 hover:underline" onClick={() => { setErr(null); setA(x) }}>Editar</button> },
        ]} />
      </Card>
      <Modal open={!!p} title={p?.id_cat_programa_educativo ? 'Editar programa' : 'Nuevo programa'} onClose={() => setP(null)} footer={<><Button variant="ghost" onClick={() => setP(null)}>Cancelar</Button><Button onClick={guardarP} disabled={!p?.nombre_carrera || !p?.division}>Guardar</Button></>}>
        <div className="space-y-3">
          <Campo label="Nombre de la carrera"><input className={inputCls} value={p?.nombre_carrera ?? ''} onChange={(e) => setP({ ...p, nombre_carrera: e.target.value })} /></Campo>
          <Campo label="División"><input className={inputCls} value={p?.division ?? ''} onChange={(e) => setP({ ...p, division: e.target.value })} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Duración (cuatrimestres)"><input className={inputCls} type="number" value={p?.duracion ?? ''} onChange={(e) => setP({ ...p, duracion: Number(e.target.value) })} /></Campo>
            <Campo label="Versión del programa" ayuda="Define la escala de evaluación."><select className={inputCls} value={p?.version ?? '2024'} onChange={(e) => setP({ ...p, version: e.target.value as '2020' | '2024' })}><option value="2020">2020 (AU, DE, SA, NA, SE)</option><option value="2024">2024 (E, A, B, R, P)</option></select></Campo>
          </div>
          {p?.id_cat_programa_educativo && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.activo ?? true} onChange={(e) => setP({ ...p, activo: e.target.checked })} />Activo</label>}
          {err && <Alerta>{err}</Alerta>}
        </div>
      </Modal>
      <Modal open={!!a} title={a?.id_asignatura ? 'Editar asignatura' : 'Nueva asignatura'} onClose={() => setA(null)} footer={<><Button variant="ghost" onClick={() => setA(null)}>Cancelar</Button><Button onClick={guardarA} disabled={!a?.nombre || !a?.clave}>Guardar</Button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><Campo label="Clave"><input className={inputCls} value={a?.clave ?? ''} onChange={(e) => setA({ ...a, clave: e.target.value })} /></Campo><Campo label="Cuatrimestre (ubicación)"><input className={inputCls} value={a?.ubicacion ?? ''} onChange={(e) => setA({ ...a, ubicacion: e.target.value })} /></Campo></div>
          <Campo label="Nombre"><input className={inputCls} value={a?.nombre ?? ''} onChange={(e) => setA({ ...a, nombre: e.target.value })} /></Campo>
          <Campo label="Descripción"><textarea className={inputCls} rows={2} value={a?.descripcion ?? ''} onChange={(e) => setA({ ...a, descripcion: e.target.value })} /></Campo>
          <div className="grid grid-cols-2 gap-3"><Campo label="Horas totales"><input className={inputCls} type="number" value={a?.horas_totales ?? ''} onChange={(e) => setA({ ...a, horas_totales: Number(e.target.value) })} /></Campo><label className="mt-6 flex items-center gap-2 text-sm"><input type="checkbox" checked={a?.optativa ?? false} onChange={(e) => setA({ ...a, optativa: e.target.checked })} />Optativa</label></div>
          {err && <Alerta>{err}</Alerta>}
        </div>
      </Modal>
    </div>
  )
}

// ---------------- Competencias ----------------
interface Comp { id_cat_competencia: number; no_competencia: number; descripcion_competencia: string; id_cat_programa_educativo: number; asignaturas: { id_asignatura: number; clave: string; nombre: string }[]; actividades_registradas: number }
export function EnlaceCompetenciasPage() {
  const { progs, sel, setSel } = useProgramas()
  const comps = useCarga(() => (sel ? api.get<Comp[]>(`/enlace/competencias?programa=${sel}`) : Promise.resolve([])), [sel])
  const asigs = useCarga(() => (sel ? api.get<Asig[]>(`/enlace/asignaturas?programa=${sel}`) : Promise.resolve([])), [sel])
  const [c, setC] = useState<{ id?: number; no_competencia: number | ''; descripcion_competencia: string; ids: number[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const guardar = async () => {
    if (!c) return
    try {
      const body = { no_competencia: c.no_competencia || undefined, descripcion_competencia: c.descripcion_competencia, id_cat_programa_educativo: Number(sel), ids_asignaturas: c.ids }
      if (c.id) await api.put(`/enlace/competencias/${c.id}`, body); else await api.post('/enlace/competencias', body)
      setC(null); comps.recargar()
    } catch (e) { setErr(mensajeError(e)) }
  }
  return (
    <div className="space-y-6">
      <Titulo sub="Catálogo institucional central: define los criterios que usan todas las unidades económicas. Una competencia abarca de 1 a 2 asignaturas." acciones={<Button disabled={!sel} onClick={() => { setErr(null); setC({ no_competencia: '', descripcion_competencia: '', ids: [] }) }}>+ Agregar competencia</Button>}>Competencias</Titulo>
      <SelectorPrograma programas={progs.datos ?? []} valor={sel} onChange={setSel} />
      <div className="grid gap-4 sm:grid-cols-2">
        {comps.datos?.map((x) => (
          <Card key={x.id_cat_competencia} title={`Competencia ${x.no_competencia}`} actions={<span className="flex gap-3 text-sm"><button type="button" className="text-brand-600 hover:underline" onClick={() => { setErr(null); setC({ id: x.id_cat_competencia, no_competencia: x.no_competencia, descripcion_competencia: x.descripcion_competencia, ids: x.asignaturas.map((s) => s.id_asignatura) }) }}>Ver detalles</button>
            <button type="button" className="text-red-600 hover:underline" onClick={async () => { try { await api.del(`/enlace/competencias/${x.id_cat_competencia}`); comps.recargar() } catch (e) { setErr(mensajeError(e)) } }}>Eliminar</button></span>}>
            <p className="text-sm text-slate-700">{x.descripcion_competencia}</p>
            <p className="mt-2 flex flex-wrap gap-1">{x.asignaturas.map((s) => <Badge key={s.id_asignatura} tone="slate">{s.clave}</Badge>)}</p>
            {x.actividades_registradas > 0 && <p className="mt-1 text-xs text-slate-500">{x.actividades_registradas} actividad(es) de alumnos la utilizan.</p>}
          </Card>
        ))}
      </div>
      {err && !c && <Alerta>{err}</Alerta>}
      <Modal open={!!c} title={c?.id ? `Competencia ${c.no_competencia}` : 'Nueva competencia'} onClose={() => setC(null)} footer={<><Button variant="ghost" onClick={() => setC(null)}>Cancelar</Button><Button onClick={guardar} disabled={!c?.descripcion_competencia || !c?.ids.length}>Guardar</Button></>}>
        {c && (
          <div className="space-y-3">
            <Campo label="Número de competencia" ayuda="Si lo dejas vacío se asigna el siguiente consecutivo."><input className={inputCls} type="number" value={c.no_competencia} onChange={(e) => setC({ ...c, no_competencia: e.target.value ? Number(e.target.value) : '' })} /></Campo>
            <Campo label="Descripción de la competencia"><textarea className={inputCls} rows={3} value={c.descripcion_competencia} onChange={(e) => setC({ ...c, descripcion_competencia: e.target.value })} /></Campo>
            <Campo label="Asignaturas (1 o 2)">
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                {asigs.datos?.map((m) => {
                  const marcada = c.ids.includes(m.id_asignatura)
                  return <label key={m.id_asignatura} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={marcada} disabled={!marcada && c.ids.length >= 2} onChange={() => setC({ ...c, ids: marcada ? c.ids.filter((i) => i !== m.id_asignatura) : [...c.ids, m.id_asignatura] })} />{m.clave} — {m.nombre}</label>
                })}
              </div>
            </Campo>
            {err && <Alerta>{err}</Alerta>}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ---------------- Planeación por materia y parcial ----------------
interface Tema { id_planeacion_tema: number; id_asignatura: number; parcial: number; orden: number; titulo: string; descripcion: string | null; resultado_esperado: string | null }
export function EnlacePlaneacionPage() {
  const { progs, sel, setSel } = useProgramas()
  const asigs = useCarga(() => (sel ? api.get<Asig[]>(`/enlace/asignaturas?programa=${sel}`) : Promise.resolve([])), [sel])
  const [asig, setAsig] = useState('')
  useEffect(() => { setAsig(asigs.datos?.[0] ? String(asigs.datos[0].id_asignatura) : '') }, [asigs.datos])
  const temas = useCarga(() => (asig ? api.get<Tema[]>(`/enlace/planeacion?asignatura=${asig}`) : Promise.resolve([])), [asig])
  const [t, setT] = useState<(Partial<Tema> & { parcial: number }) | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const guardar = async () => {
    if (!t) return
    try { if (t.id_planeacion_tema) await api.put(`/enlace/planeacion/${t.id_planeacion_tema}`, t); else await api.post('/enlace/planeacion', { ...t, id_asignatura: Number(asig) }); setT(null); temas.recargar() } catch (e) { setErr(mensajeError(e)) }
  }
  return (
    <div className="space-y-6">
      <Titulo sub="Planeación de cada asignatura por parcial: título, descripción y resultado esperado.">Planeación</Titulo>
      <div className="flex flex-wrap gap-3">
        <SelectorPrograma programas={progs.datos ?? []} valor={sel} onChange={setSel} />
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={asig} onChange={(e) => setAsig(e.target.value)}>{asigs.datos?.map((m) => <option key={m.id_asignatura} value={m.id_asignatura}>{m.clave} — {m.nombre}</option>)}</select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((p) => (
          <Card key={p} title={`Parcial ${p}`} actions={<button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => { setErr(null); setT({ parcial: p, titulo: '' }) }}>+ Tema</button>}>
            <ul className="space-y-2 text-sm">
              {temas.datos?.filter((x) => x.parcial === p).map((x) => (
                <li key={x.id_planeacion_tema}><p className="font-medium text-slate-800">{x.titulo}</p><p className="text-xs text-slate-500">{x.resultado_esperado ?? ''}</p>
                  <span className="flex gap-3 text-xs"><button type="button" className="text-brand-600 hover:underline" onClick={() => { setErr(null); setT(x) }}>Editar</button><button type="button" className="text-red-600 hover:underline" onClick={async () => { await api.del(`/enlace/planeacion/${x.id_planeacion_tema}`); temas.recargar() }}>Quitar</button></span></li>
              ))}
              {temas.datos?.filter((x) => x.parcial === p).length === 0 && <li className="text-slate-400">Sin temas.</li>}
            </ul>
          </Card>
        ))}
      </div>
      <Modal open={!!t} title={t?.id_planeacion_tema ? 'Editar tema' : `Nuevo tema — Parcial ${t?.parcial}`} onClose={() => setT(null)} footer={<><Button variant="ghost" onClick={() => setT(null)}>Cancelar</Button><Button disabled={!t?.titulo} onClick={guardar}>Guardar</Button></>}>
        <div className="space-y-3">
          <Campo label="Título"><input className={inputCls} value={t?.titulo ?? ''} onChange={(e) => t && setT({ ...t, titulo: e.target.value })} /></Campo>
          <Campo label="Descripción"><textarea className={inputCls} rows={2} value={t?.descripcion ?? ''} onChange={(e) => t && setT({ ...t, descripcion: e.target.value })} /></Campo>
          <Campo label="Resultado esperado"><textarea className={inputCls} rows={2} value={t?.resultado_esperado ?? ''} onChange={(e) => t && setT({ ...t, resultado_esperado: e.target.value })} /></Campo>
          {err && <Alerta>{err}</Alerta>}
        </div>
      </Modal>
    </div>
  )
}
