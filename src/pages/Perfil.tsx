import { useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alerta, Campo, Titulo, inputCls } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api, mensajeError } from '../lib/api'

export function PerfilPage() {
  const { usuario, refrescar } = useAuth()
  const [correo, setCorreo] = useState(usuario?.correo ?? '')
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '')
  const [nombre, setNombre] = useState(usuario?.nombre_pila ?? '')
  const [ap, setAp] = useState(usuario?.apellido_paterno ?? '')
  const [am, setAm] = useState(usuario?.apellido_materno ?? '')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [pw, setPw] = useState({ actual: '', nueva: '' })
  const [msgPw, setMsgPw] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  if (!usuario) return null

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.put('/auth/me', { correo, telefono, ...(usuario.datos_de_universidad ? {} : { nombre, apellido_paterno: ap, apellido_materno: am }) })
      await refrescar()
      setMsg({ tipo: 'ok', texto: 'Datos actualizados.' })
    } catch (err) {
      setMsg({ tipo: 'error', texto: mensajeError(err) })
    }
  }
  const cambiarPw = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.put('/auth/me/password', pw)
      setPw({ actual: '', nueva: '' })
      setMsgPw({ tipo: 'ok', texto: 'Contraseña actualizada.' })
    } catch (err) {
      setMsgPw({ tipo: 'error', texto: mensajeError(err) })
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Titulo>Mi perfil</Titulo>
      <Card title="Datos personales">
        <form onSubmit={guardar} className="space-y-3">
          {usuario.datos_de_universidad ? (
            <>
              <Campo label="Nombre completo" ayuda="Se obtiene de los servicios de la Universidad; no se edita aquí.">
                <input className={inputCls} value={usuario.nombre} disabled />
              </Campo>
              <Campo label="Identificador (matrícula / clave)"><input className={inputCls} value={usuario.id_externo ?? ''} disabled /></Campo>
            </>
          ) : (
            <>
              <Campo label="Nombre(s)"><input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Apellido paterno"><input className={inputCls} value={ap} onChange={(e) => setAp(e.target.value)} /></Campo>
                <Campo label="Apellido materno"><input className={inputCls} value={am} onChange={(e) => setAm(e.target.value)} /></Campo>
              </div>
            </>
          )}
          <Campo label="Correo electrónico (usuario)"><input className={inputCls} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} /></Campo>
          <Campo label="Teléfono"><input className={inputCls} value={telefono} onChange={(e) => setTelefono(e.target.value)} /></Campo>
          {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}
          <Button type="submit">Guardar cambios</Button>
        </form>
      </Card>
      <Card title="Cambiar contraseña">
        <form onSubmit={cambiarPw} className="space-y-3">
          <Campo label="Contraseña actual"><input className={inputCls} type="password" required value={pw.actual} onChange={(e) => setPw({ ...pw, actual: e.target.value })} autoComplete="current-password" /></Campo>
          <Campo label="Nueva contraseña" ayuda="Mínimo 8 caracteres."><input className={inputCls} type="password" minLength={8} required value={pw.nueva} onChange={(e) => setPw({ ...pw, nueva: e.target.value })} autoComplete="new-password" /></Campo>
          {msgPw && <Alerta tipo={msgPw.tipo}>{msgPw.texto}</Alerta>}
          <Button type="submit">Actualizar contraseña</Button>
        </form>
      </Card>
    </div>
  )
}
