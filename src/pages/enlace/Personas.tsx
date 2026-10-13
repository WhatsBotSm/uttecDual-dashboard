import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Modal } from '../../components/Modal'
import { Table } from '../../components/Table'
import { Alerta, Campo, Cargando, Titulo, inputCls, useCarga } from '../../components/ui'
import { api, mensajeError } from '../../lib/api'
import type { Rol } from '../../lib/types'

interface Fila { id_cat_user: number; rol: Rol; activo: boolean; usuario: string; nombre_completo: string; telefono: string | null; matricula: string | null; cuatrimestre_actual: number | null; nombre_carrera: string | null; puesto: string | null; empresa: string | null; id_externo: string | null; asignado: boolean | null }
const ROLES: [Rol, string][] = [['ALUMNO', 'Alumnos'], ['MENTOR_ACADEMICO', 'Mentores académicos'], ['MENTOR_UE', 'Mentores de UE'], ['ENLACE_DUAL', 'Enlaces de Educación Dual']]

export function EnlacePersonasPage() {
  const [rol, setRol] = useState<Rol>('ALUMNO')
  const { datos, error, cargando, recargar } = useCarga(() => api.get<Fila[]>(`/enlace/usuarios?rol=${rol}`), [rol])
  const progs = useCarga(() => api.get<{ id: number; nombre_carrera: string; version: string }[]>('/auth/programas'))
  const emps = useCarga(() => api.get<{ id_empresa: number; razon_social: string }[]>('/enlace/empresas'))
  const [f, setF] = useState<Record<string, string> | null>(null)
  const [pw, setPw] = useState<{ id: number; v: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const crear = async () => {
    try { await api.post('/enlace/usuarios', { ...f, rol }); setF(null); recargar() } catch (e) { setErr(mensajeError(e)) }
  }
  const alternar = async (u: Fila) => { await api.put(`/enlace/usuarios/${u.id_cat_user}`, { activo: !u.activo }); recargar() }
  const resetear = async () => {
    if (!pw) return
    try { await api.put(`/enlace/usuarios/${pw.id}`, { password: pw.v }); setPw(null) } catch (e) { setErr(mensajeError(e)) }
  }
  const apiTipo = rol === 'ALUMNO' || rol === 'MENTOR_ACADEMICO'

  return (
    <div className="space-y-6">
      <Titulo sub="Alta de alumnos, mentores y enlaces. El nombre de alumnos y mentores académicos se obtiene de los servicios de la Universidad a partir de su identificador." acciones={<Button onClick={() => { setErr(null); setF({}) }}>+ Nueva cuenta</Button>}>Personas y cuentas</Titulo>
      <div className="flex gap-2 text-sm">{ROLES.map(([r, l]) => <button key={r} type="button" onClick={() => setRol(r)} className={`rounded-md px-3 py-1 ${rol === r ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>{l}</button>)}</div>
      {error && <Alerta>{error}</Alerta>}
      <Card>{cargando ? <Cargando /> : (
        <Table rows={datos ?? []} rowKey={(u) => String(u.id_cat_user)} columns={[
          { header: 'Nombre', render: (u) => u.nombre_completo }, { header: 'Usuario (correo)', render: (u) => u.usuario },
          ...(rol === 'ALUMNO' ? [{ header: 'Matrícula', render: (u: Fila) => u.matricula }, { header: 'Programa', render: (u: Fila) => u.nombre_carrera }, { header: 'Cuatri.', render: (u: Fila) => `${u.cuatrimestre_actual}º` }, { header: 'Asignado', render: (u: Fila) => (u.asignado ? 'Sí' : 'No') }] : []),
          ...(rol === 'MENTOR_UE' ? [{ header: 'Unidad económica', render: (u: Fila) => u.empresa }] : []),
          ...(rol === 'MENTOR_ACADEMICO' ? [{ header: 'Clave', render: (u: Fila) => u.id_externo }] : []),
          { header: 'Estatus', render: (u) => <Badge tone={u.activo ? 'green' : 'red'}>{u.activo ? 'ACTIVA' : 'INACTIVA'}</Badge> },
          { header: '', render: (u) => <span className="flex gap-3 text-sm"><button type="button" className="text-brand-600 hover:underline" onClick={() => alternar(u)}>{u.activo ? 'Desactivar' : 'Activar'}</button><button type="button" className="text-brand-600 hover:underline" onClick={() => { setErr(null); setPw({ id: u.id_cat_user, v: '' }) }}>Restablecer contraseña</button></span> },
        ]} />)}</Card>

      <Modal open={!!f} title={`Nueva cuenta — ${ROLES.find((r) => r[0] === rol)?.[1]}`} onClose={() => setF(null)} footer={<><Button variant="ghost" onClick={() => setF(null)}>Cancelar</Button><Button onClick={crear}>Crear cuenta</Button></>}>
        <div className="space-y-3">
          {rol === 'ALUMNO' && <Campo label="Matrícula"><input className={inputCls} value={f?.matricula ?? ''} onChange={set('matricula')} /></Campo>}
          {rol === 'MENTOR_ACADEMICO' && <Campo label="Clave de empleado (identificador en la Universidad)"><input className={inputCls} value={f?.id_externo ?? ''} onChange={set('id_externo')} /></Campo>}
          {apiTipo && <p className="text-xs text-slate-500">Si la Universidad devuelve los datos de la persona, no hace falta capturar el nombre; si no, el sistema te lo pedirá.</p>}
          <div className="grid grid-cols-3 gap-3">
            <Campo label="Nombre(s)"><input className={inputCls} value={f?.nombre ?? ''} onChange={set('nombre')} /></Campo>
            <Campo label="Apellido paterno"><input className={inputCls} value={f?.apellido_paterno ?? ''} onChange={set('apellido_paterno')} /></Campo>
            <Campo label="Apellido materno"><input className={inputCls} value={f?.apellido_materno ?? ''} onChange={set('apellido_materno')} /></Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Correo (usuario)"><input className={inputCls} type="email" value={f?.correo ?? ''} onChange={set('correo')} /></Campo>
            <Campo label="Teléfono"><input className={inputCls} value={f?.telefono ?? ''} onChange={set('telefono')} /></Campo>
          </div>
          {rol === 'ALUMNO' && (
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Programa educativo"><select className={inputCls} value={f?.id_programa ?? ''} onChange={set('id_programa')}><option value="">Selecciona…</option>{progs.datos?.map((p) => <option key={p.id} value={p.id}>{p.nombre_carrera} (v{p.version})</option>)}</select></Campo>
              <Campo label="Cuatrimestre actual"><input className={inputCls} type="number" value={f?.cuatrimestre_actual ?? ''} onChange={set('cuatrimestre_actual')} /></Campo>
            </div>
          )}
          {rol === 'MENTOR_UE' && <Campo label="Unidad económica"><select className={inputCls} value={f?.id_empresa ?? ''} onChange={set('id_empresa')}><option value="">Selecciona…</option>{emps.datos?.map((e) => <option key={e.id_empresa} value={e.id_empresa}>{e.razon_social}</option>)}</select></Campo>}
          {rol !== 'ALUMNO' && <div className="grid grid-cols-2 gap-3"><Campo label="Puesto"><input className={inputCls} value={f?.puesto ?? ''} onChange={set('puesto')} /></Campo><Campo label="Grado académico"><input className={inputCls} value={f?.grado_academico ?? ''} onChange={set('grado_academico')} /></Campo></div>}
          <Campo label="Contraseña inicial" ayuda="Mínimo 8 caracteres. La persona podrá cambiarla desde su perfil."><input className={inputCls} type="password" value={f?.password ?? ''} onChange={set('password')} autoComplete="new-password" /></Campo>
          {err && <Alerta>{err}</Alerta>}
        </div>
      </Modal>
      <Modal open={!!pw} title="Restablecer contraseña" onClose={() => setPw(null)} footer={<><Button variant="ghost" onClick={() => setPw(null)}>Cancelar</Button><Button disabled={(pw?.v.length ?? 0) < 8} onClick={resetear}>Guardar</Button></>}>
        <Campo label="Nueva contraseña (mínimo 8 caracteres)"><input className={inputCls} type="password" value={pw?.v ?? ''} onChange={(e) => pw && setPw({ ...pw, v: e.target.value })} autoComplete="new-password" /></Campo>
        {err && <Alerta>{err}</Alerta>}
      </Modal>
    </div>
  )
}
