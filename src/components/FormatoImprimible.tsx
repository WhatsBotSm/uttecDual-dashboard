// Representación imprimible de los 5 formatos oficiales (FOR-GSE-SAC-01-K, L, M, Ñ y O). Se genera a
// partir de la información estructurada y de los datos capturados por los actores autorizados; el
// mismo componente sirve para consultar en línea, guardar como PDF o imprimir para firma autógrafa
// (window.print() + @media print en index.css).
import type { ReactNode } from 'react'
import type { Imprimible } from '../lib/types'

const fecha = (f?: unknown) =>
  typeof f === 'string' && f ? new Date(f.slice(0, 10) + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
const txt = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v))

function Hoja({ children, titulo, codigo }: { children: ReactNode; titulo: string; codigo: string }) {
  return (
    <div className="reporte-hoja mx-auto mb-6 w-full max-w-[210mm] border border-slate-300 bg-white p-6 text-[11px] leading-snug text-slate-800 shadow-sm print:mb-0 print:w-[190mm] print:p-0 print:shadow-none">
      <header className="mb-3 border-b-2 border-slate-800 pb-2 text-center">
        <p className="text-xs font-semibold text-slate-500">Universidad Tecnológica de Tecámac</p>
        <h1 className="text-sm font-bold uppercase">{titulo}</h1>
        <p className="text-[10px] text-slate-500">{codigo}</p>
      </header>
      {children}
    </div>
  )
}
const Barra = ({ children }: { children: ReactNode }) => (
  <p className="mb-1 mt-3 bg-slate-800 px-2 py-1 font-semibold uppercase text-white">{children}</p>
)
const Dato = ({ k, v, span = 1 }: { k: string; v: ReactNode; span?: number }) => (
  <p className={span === 2 ? 'col-span-2' : ''}><span className="font-semibold">{k}:</span> {v}</p>
)
const Caja = ({ children, min = 12 }: { children: ReactNode; min?: number }) => (
  <p className="whitespace-pre-wrap border border-slate-300 p-2" style={{ minHeight: `${min * 0.25}rem` }}>{children}</p>
)
const th = 'border border-slate-300 bg-slate-100 px-1 py-1 text-left font-semibold'
const td = 'border border-slate-300 px-1 py-1 align-top'

function Firmas({ items }: { items: [string, string][] }) {
  return (
    <section className="mt-10 grid gap-6 text-center" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map(([nombre, rol]) => (
        <div key={rol}>
          <div className="border-t border-slate-800 pt-1">{nombre || ' '}</div>
          <p className="text-slate-500">{rol}</p>
        </div>
      ))}
    </section>
  )
}

function DatosBase({ d }: { d: Imprimible }) {
  const a = d.asignacion
  return (
    <section className="grid grid-cols-2 gap-x-4 gap-y-1 border border-slate-300 p-2">
      <Dato k="Nombre del Proyecto o Plan de Rotación" v={d.iniciativa?.nombre_proyecto ?? '—'} span={2} />
      <Dato k="Unidad Económica" v={d.empresa.razon_social} span={2} />
      <Dato k="Institución Educativa" v={d.programa.institucion_educativa} />
      <Dato k="Programa Educativo" v={`${d.programa.nombre_carrera} (versión ${d.programa.version})`} />
      <Dato k="Estudiante Dual" v={`${a.alumno?.nombre_completo ?? '—'} — Tel. ${a.alumno?.telefono ?? '—'}`} />
      <Dato k="Matrícula / Cuatrimestre" v={`${a.matricula} / ${a.cuatrimestre}º`} />
      <Dato k="Mentor de la UE" v={`${a.mentor_ue?.nombre_completo ?? '—'} — Tel. ${a.mentor_ue?.telefono ?? '—'}`} />
      <Dato k="Mentor Académico" v={`${a.mentor_academico?.nombre_completo ?? '—'} — Tel. ${a.mentor_academico?.telefono ?? '—'}`} />
    </section>
  )
}

function TablaCompetencias({ d }: { d: Imprimible }) {
  return (
    <table className="w-full border-collapse">
      <thead><tr><th className={th} style={{ width: '8%' }}>No.</th><th className={th}>Competencias a desarrollar</th><th className={th} style={{ width: '30%' }}>Asignaturas</th></tr></thead>
      <tbody>
        {d.competencias.length === 0 ? <tr><td className={`${td} text-slate-400`} colSpan={3}>Sin competencias para las materias de la estancia.</td></tr> :
          d.competencias.map((c) => (
            <tr key={c.id_cat_competencia}>
              <td className={td}>{c.no_competencia}</td><td className={td}>{c.descripcion_competencia}</td>
              <td className={td}>{c.asignaturas.map((s) => s.clave).join(', ')}</td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}

function Calendarizacion({ valores }: { valores: unknown }) {
  const dias = Array.isArray(valores) ? valores : []
  return (
    <table className="w-full border-collapse text-center">
      <tbody>
        <tr><td className={th}>MES</td>{Array.from({ length: 12 }, (_, i) => <td key={i} className={th}>{i + 1}</td>)}</tr>
        <tr><td className={th}>DÍA</td>{Array.from({ length: 12 }, (_, i) => <td key={i} className={td}>{txt(dias[i])}</td>)}</tr>
      </tbody>
    </table>
  )
}

// ---------------- K ----------------
function FormatoK({ d }: { d: Imprimible }) {
  const c = d.formato.contenido
  const porCuatri = d.actividades
  const horas = porCuatri.reduce((s, a) => s + (a.horas_dedicacion ?? 0), 0)
  return (
    <Hoja titulo="Plan de Formación de Educación Dual" codigo={d.formato.codigo}>
      <p className="mb-2 text-right text-slate-500">Tecámac, Estado de México, a {fecha(c.fecha_elaboracion ?? new Date().toISOString())}</p>
      <DatosBase d={d} />
      <section className="mt-2 grid grid-cols-3 gap-x-4 border border-slate-300 p-2">
        <Dato k="No. estudiantes dual" v="1" />
        <Dato k="No. mentores de la UE" v={d.asignacion.mentor_ue ? '1' : '0'} />
        <Dato k="No. mentores académicos" v={d.asignacion.mentor_academico ? '1' : '0'} />
        <Dato k="Duración del Plan (periodos)" v={txt(c.duracion_periodos ?? d.asignacion.duracion_estancia_dual)} span={2} />
      </section>
      <Barra>Descripción del proyecto (¿qué?, ¿cómo?, ¿dónde?, ¿cuándo?, ¿para qué?)</Barra>
      <Caja>{txt(c.descripcion_proyecto ?? d.iniciativa?.descripcion)}</Caja>
      <Barra>Competencias a desarrollar</Barra>
      <TablaCompetencias d={d} />
      <Barra>Actividades a realizar para desarrollar las competencias — {d.asignacion.cuatrimestre}º cuatrimestre</Barra>
      <table className="w-full border-collapse">
        <thead><tr><th className={th}>No. Comp.</th><th className={th}>Actividades</th><th className={th}>Asignatura</th><th className={th}>Horas</th><th className={th}>Evidencias o productos</th><th className={th}>Lugar UE/IE</th></tr></thead>
        <tbody>
          {porCuatri.length === 0 ? <tr><td className={`${td} text-slate-400`} colSpan={6}>Aún no hay actividades registradas.</td></tr> :
            porCuatri.map((a) => (
              <tr key={a.id_actividades}><td className={td}>{a.no_competencia}</td><td className={td}>{a.descripcion_actividad}</td><td className={td}>{a.clave_asignatura}</td><td className={td}>{txt(a.horas_dedicacion)}</td><td className={td}>{txt(a.entregable)}</td><td className={td}>UE</td></tr>
            ))}
        </tbody>
      </table>
      <p className="mt-1">Horas totales registradas: <strong>{horas}</strong> · Número de horas a la semana del Estudiante Dual en la UE: <strong>{txt(c.horas_semana)}</strong> · Horario: {txt(d.asignacion.horario)} · Días: {txt(d.asignacion.dias_asistencia)}</p>
      <Barra>Calendarización del seguimiento de la IE en la UE</Barra>
      <Calendarizacion valores={c.calendarizacion} />
      <section className="mt-3 grid grid-cols-2 gap-3">
        <div><p className={th}>Criterios deseables para la supervisión del Plan de Formación</p><Caja min={14}>{'1. Ejecución del plan de formación.\n2. Acompañamiento académico.\n3. Seguimiento y retroalimentación.'}</Caja></div>
        <div><p className={th}>Criterios deseables para la evaluación del Plan de Formación</p><Caja min={14}>{'1. Desempeño en el entorno laboral.\n2. Aplicación de conocimientos teóricos.\n3. Desarrollo de habilidades blandas.'}</Caja></div>
      </section>
      <Barra>Cumplimiento de normatividad de la UE</Barra>
      <Caja>La Unidad Económica dará a conocer la normatividad aplicable en el desarrollo de las actividades descritas en el Plan de Formación a efecto de ser atendida por el estudiante.</Caja>
      <Firmas items={[[d.asignacion.mentor_ue?.nombre_completo ?? '', 'Mentor(a) de la Unidad Económica'], ['', 'Responsable de la Unidad Económica'], [d.asignacion.mentor_academico?.nombre_completo ?? '', 'Mentor(a) Académico'], ['', 'Director(a) de la División']]} />
    </Hoja>
  )
}

// ---------------- L ----------------
function FormatoL({ d }: { d: Imprimible }) {
  const c = d.formato.contenido
  return (
    <Hoja titulo="Plan de Rotación de Educación Dual" codigo={d.formato.codigo}>
      <DatosBase d={d} />
      <Barra>Responsables</Barra>
      <section className="grid grid-cols-2 gap-x-4 gap-y-1 border border-slate-300 p-2">
        <Dato k="Nombre del Plan de Rotación" v={txt(c.nombre_plan ?? d.iniciativa?.nombre_proyecto)} span={2} />
        <Dato k="Mentor Académico" v={d.asignacion.mentor_academico?.nombre_completo ?? '—'} />
        <Dato k="Mentor de la Unidad Económica" v={d.asignacion.mentor_ue?.nombre_completo ?? '—'} />
      </section>
      <Barra>Descripción y duración del programa</Barra>
      <Caja>{txt(c.descripcion_plan ?? d.iniciativa?.descripcion)}</Caja>
      <p className="mt-1"><span className="font-semibold">Duración total:</span> {txt(c.duracion_total ?? d.iniciativa?.duracion)}</p>
      <Barra>Listado de puestos de aprendizaje</Barra>
      <table className="w-full border-collapse">
        <thead><tr><th className={th}>No.</th><th className={th}>Puesto</th><th className={th}>Cuatrimestre</th><th className={th}>Periodo de ejecución</th></tr></thead>
        <tbody>
          {d.puestos.length === 0 ? <tr><td className={`${td} text-slate-400`} colSpan={4}>Sin puestos de aprendizaje registrados.</td></tr> :
            d.puestos.map((p, i) => <tr key={p.id_puesto}><td className={td}>{i + 1}</td><td className={td}>{p.nombre}</td><td className={td}>{txt(p.cuatrimestre)}</td><td className={td}>{txt(p.periodo)}</td></tr>)}
        </tbody>
      </table>
      <p className="mb-1 mt-3 font-semibold">Elaboraron</p>
      <Firmas items={[[d.asignacion.mentor_ue?.nombre_completo ?? '', 'Mentor(a) de la UE'], [d.asignacion.mentor_academico?.nombre_completo ?? '', 'Mentor(a) Académico']]} />
    </Hoja>
  )
}

// ---------------- M ----------------
function FormatoM({ d }: { d: Imprimible }) {
  const puestos = d.puestos.length ? d.puestos : [null]
  return (
    <>
      {puestos.map((p, i) => (
        <Hoja key={p?.id_puesto ?? i} titulo="Puesto de Aprendizaje de Educación Dual" codigo={d.formato.codigo}>
          <section className="grid grid-cols-2 gap-x-4 gap-y-1 border border-slate-300 p-2">
            <Dato k="Unidad Económica" v={d.empresa.razon_social} span={2} />
            <Dato k="Programa Educativo" v={d.programa.nombre_carrera} />
            <Dato k="Cuatrimestre" v={txt(p?.cuatrimestre ?? d.asignacion.cuatrimestre)} />
            <Dato k="Plan de Rotación" v={d.iniciativa?.nombre_proyecto ?? '—'} />
            <Dato k="Puesto de Aprendizaje" v={txt(p?.nombre)} />
            <Dato k="Mentor de la UE" v={d.asignacion.mentor_ue?.nombre_completo ?? '—'} />
            <Dato k="Mentor Académico" v={d.asignacion.mentor_academico?.nombre_completo ?? '—'} />
          </section>
          <Barra>Tiempos de formación</Barra><Caja min={8}>{txt(p?.periodo)}</Caja>
          <Barra>Objetivo del puesto de aprendizaje y requerimientos</Barra>
          <section className="grid grid-cols-2 gap-3"><Caja min={20}>{txt(p?.objetivo)}</Caja><Caja min={20}>{txt(p?.requerimientos)}</Caja></section>
          <Barra>Actividades a desarrollar</Barra><Caja min={24}>{txt(p?.actividades)}</Caja>
          <Barra>Conocimientos necesarios</Barra>
          <section className="grid grid-cols-3 gap-3">
            <div><p className={th}>Teóricos</p><Caja min={24}>{txt(p?.conocimientos_teoricos)}</Caja></div>
            <div><p className={th}>Procedimentales</p><Caja min={24}>{txt(p?.conocimientos_procedimentales)}</Caja></div>
            <div><p className={th}>Actitudinales</p><Caja min={24}>{txt(p?.conocimientos_actitudinales)}</Caja></div>
          </section>
          <p className="mb-1 mt-3 font-semibold">Elaboraron</p>
          <Firmas items={[[d.asignacion.mentor_ue?.nombre_completo ?? '', 'Mentor(a) de la UE'], [d.asignacion.mentor_academico?.nombre_completo ?? '', 'Mentor(a) Académico']]} />
        </Hoja>
      ))}
    </>
  )
}

// ---------------- Ñ ----------------
function FormatoN({ d }: { d: Imprimible }) {
  const c = d.formato.contenido
  const acts = d.actividades.filter((a) => a.parcial === d.formato.parcial)
  const niveles = [...d.escala].sort((x, y) => y.orden - x.orden)
  const porComp = d.competencias.filter((comp) => acts.some((a) => a.id_cat_competencia === comp.id_cat_competencia))
  const imgs = (Array.isArray(c.evidencia_grafica) ? (c.evidencia_grafica as string[]) : []).filter(Boolean)
  return (
    <Hoja titulo="Reporte de Actividades del Estudiante de Educación Dual" codigo={`${d.formato.codigo} — Parcial ${d.formato.parcial}`}>
      <section className="grid grid-cols-2 gap-x-4 gap-y-1 border border-slate-300 p-2">
        <Dato k="Número de Reporte" v={txt(c.numero_reporte)} />
        <Dato k="Fecha de Elaboración" v={fecha(c.fecha_elaboracion)} />
        <Dato k="Periodo del Reporte" v={`${fecha(c.periodo_inicio)} al ${fecha(c.periodo_fin)}`} span={2} />
        <Dato k="Nombre del Proyecto o Plan de Rotación" v={txt(c.nombre_proyecto ?? d.iniciativa?.nombre_proyecto)} span={2} />
        <Dato k="Unidad Económica" v={d.empresa.razon_social} span={2} />
        <Dato k="Institución Educativa" v={d.programa.institucion_educativa} />
        <Dato k="Programa Educativo" v={d.programa.nombre_carrera} />
        <Dato k="Estudiante Dual" v={`${d.asignacion.alumno?.nombre_completo ?? '—'} — Tel. ${d.asignacion.alumno?.telefono ?? '—'}`} />
        <Dato k="Mentor de la UE" v={`${d.asignacion.mentor_ue?.nombre_completo ?? '—'} — Tel. ${d.asignacion.mentor_ue?.telefono ?? '—'}`} />
        <Dato k="Mentor Académico" v={`${d.asignacion.mentor_academico?.nombre_completo ?? '—'} — Tel. ${d.asignacion.mentor_academico?.telefono ?? '—'}`} span={2} />
      </section>
      <Barra>Desarrollo de competencias</Barra><TablaCompetencias d={d} />
      <Barra>Marco teórico o antecedentes</Barra><Caja>{txt(c.marco_teorico)}</Caja>
      <Barra>Descripción de las actividades realizadas</Barra><Caja>{txt(c.descripcion_actividades)}</Caja>
      <Barra>Evaluación de la UE — Matriz de evaluación por competencia (escala versión {d.programa.version})</Barra>
      {porComp.length === 0 ? <Caja min={8}>Sin actividades registradas.</Caja> : porComp.map((comp) => (
        <table key={comp.id_cat_competencia} className="mb-2 w-full border-collapse">
          <thead>
            <tr><th className={th} colSpan={4 + niveles.length}>Competencia {comp.no_competencia}: {comp.descripcion_competencia}</th></tr>
            <tr><th className={th}>Actividades</th><th className={th}>Asignatura</th><th className={th}>Evidencias o productos</th><th className={th}>Horas</th>{niveles.map((n) => <th key={n.codigo} className={`${th} text-center`} title={n.nombre}>{n.codigo}</th>)}</tr>
          </thead>
          <tbody>
            {acts.filter((a) => a.id_cat_competencia === comp.id_cat_competencia).map((a) => (
              <tr key={a.id_actividades}><td className={td}>{a.descripcion_actividad}</td><td className={td}>{a.clave_asignatura}</td><td className={td}>{txt(a.entregable)}</td><td className={`${td} text-center`}>{txt(a.horas_dedicacion)}</td>
                {niveles.map((n) => <td key={n.codigo} className={`${td} text-center font-bold`}>{a.desempeno === n.codigo ? 'X' : ''}</td>)}</tr>
            ))}
          </tbody>
        </table>
      ))}
      <section className="mt-2 grid grid-cols-2 gap-3">
        <div><p className={th}>Retroalimentación al desempeño del estudiante por parte del Mentor de la UE</p><Caja min={14}>{txt(d.formato.retroalimentacion)}</Caja></div>
        <div><p className={th}>Evidencia gráfica de seguimiento y/o supervisión</p>
          <div className="flex min-h-14 flex-wrap gap-2 border border-slate-300 p-2">
            {imgs.length === 0 ? <span className="text-slate-400">Sin fotografías adjuntas.</span> : imgs.map((u) => <img key={u} src={u} alt="Evidencia gráfica" className="h-20 w-20 object-cover" />)}
          </div>
        </div>
      </section>
      <Firmas items={[[d.asignacion.alumno?.nombre_completo ?? '', 'Elaboró — Estudiante Dual'], [d.asignacion.mentor_ue?.nombre_completo ?? '', 'Nombre, firma y fecha — Mentor de la UE'], [d.asignacion.mentor_academico?.nombre_completo ?? '', 'Autorizó — Mentor Académico']]} />
    </Hoja>
  )
}

// ---------------- O ----------------
function FormatoO({ d }: { d: Imprimible }) {
  const c = d.formato.contenido
  const niveles = [...d.escala].sort((x, y) => y.orden - x.orden)
  const finales = (c.calificaciones ?? {}) as Record<string, { codigo: string; valor: number }>
  return (
    <Hoja titulo="Seguimiento y Evaluación del Estudiante de Educación Dual" codigo={d.formato.codigo}>
      <DatosBase d={d} />
      <section className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border border-slate-300 p-2">
        <Dato k="Periodo / duración" v={txt(d.iniciativa?.duracion)} />
        <Dato k="Horario" v={txt(d.asignacion.horario)} />
        <Dato k="Apoyo" v={txt(d.empresa.apoyos)} />
        <Dato k="Monto" v={d.empresa.monto ? `$${d.empresa.monto}` : '—'} />
      </section>
      <Barra>Descripción del proyecto</Barra><Caja>{txt(c.descripcion_proyecto ?? d.iniciativa?.descripcion)}</Caja>
      <Barra>Competencias a desarrollar</Barra><TablaCompetencias d={d} />
      <Barra>Matriz de evaluación de las competencias (promedio de los 3 parciales)</Barra>
      <table className="w-full border-collapse">
        <thead><tr><th className={th}>Asignatura</th><th className={`${th} text-center`}>Parcial 1</th><th className={`${th} text-center`}>Parcial 2</th><th className={`${th} text-center`}>Parcial 3</th><th className={`${th} text-center`}>Promedio</th>{niveles.map((n) => <th key={n.codigo} className={`${th} text-center`} title={n.nombre}>{n.codigo}</th>)}</tr></thead>
        <tbody>
          {d.asignaturas.map((s) => {
            const ps = [1, 2, 3].map((p) => d.calificaciones[p]?.find((x) => x.id_asignatura === s.id_asignatura)?.promedio ?? null)
            const validos = ps.filter((v): v is number => v !== null)
            const prom = validos.length ? Math.round((validos.reduce((a, b) => a + b, 0) / validos.length) * 10) / 10 : null
            const fin = finales[String(s.id_asignatura)]
            return (
              <tr key={s.id_asignatura}><td className={td}>{s.clave} — {s.nombre}</td>
                {ps.map((v, i) => <td key={i} className={`${td} text-center`}>{v ?? '—'}</td>)}
                <td className={`${td} text-center font-semibold`}>{prom ?? '—'}</td>
                {niveles.map((n) => <td key={n.codigo} className={`${td} text-center font-bold`}>{fin?.codigo === n.codigo ? 'X' : ''}</td>)}</tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-1 text-slate-500">Las calificaciones finales (columnas de nivel) las captura el Mentor de la UE al cierre del cuatrimestre, cuando los 3 parciales están evaluados.</p>
      <Barra>Calendarización del seguimiento</Barra><Calendarizacion valores={c.calendarizacion} />
      <Barra>Retroalimentación al desempeño</Barra>
      <Caja>{txt(c.retroalimentacion_final)}</Caja>
      <p className="mb-1 mt-3 font-semibold">Autorizaron</p>
      <Firmas items={[[d.asignacion.mentor_academico?.nombre_completo ?? '', 'Mentor(a) Académico'], ['', 'Director(a) de División Académica']]} />
    </Hoja>
  )
}

export function FormatoImprimible({ data }: { data: Imprimible }) {
  switch (data.formato.clave) {
    case 'K': return <FormatoK d={data} />
    case 'L': return <FormatoL d={data} />
    case 'M': return <FormatoM d={data} />
    case 'N': return <FormatoN d={data} />
    case 'O': return <FormatoO d={data} />
  }
}
