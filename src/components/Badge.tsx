type Tone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'purple'

const toneClasses: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
}

// Mapea los distintos "estatus" del dominio (solicitud, asignación, formato, evaluación) a un
// color consistente en toda la app.
const estatusToneMap: Record<string, Tone> = {
  PENDIENTE: 'amber',
  EN_PROCESO: 'amber',
  BORRADOR: 'slate',
  EN_REVISION: 'blue',
  ACEPTADA: 'green',
  ACEPTADO: 'green',
  ACTIVA: 'green',
  EVALUADO: 'green',
  RECHAZADA: 'red',
  RECHAZADO: 'red',
  CANCELADA: 'red',
  FINALIZADA: 'slate',
}

export function estatusTone(estatus: string): Tone {
  return estatusToneMap[estatus] ?? 'slate'
}

interface BadgeProps {
  children: string
  tone?: Tone
}

export function Badge({ children, tone }: BadgeProps) {
  const resolved = tone ?? estatusTone(children)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[resolved]}`}>
      {children.replaceAll('_', ' ')}
    </span>
  )
}
