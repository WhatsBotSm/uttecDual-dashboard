# Contrato de API que consume el frontend

El frontend solo habla con `/api` (ver `src/lib/api.ts`). Mientras no existan las 3 APIs nuevas, ese
contrato lo cumple el backend actual (`uttec-dual-backend`). Las APIs nuevas deben respetar estas rutas
y las formas de respuesta de `src/lib/types.ts`, o bien se adapta `api.ts`/`types.ts` en el frontend.

Autenticación: `Authorization: Bearer <JWT>` (el token se guarda en `localStorage`, clave `uttecdual.token`).
Si la API responde 401 (fuera de `/auth/login`), el front cierra la sesión.
Errores: `{ "error": "mensaje" }` con el código HTTP correspondiente.

## Auth (`/api/auth`)
- POST `/auth/login` · POST `/auth/registro` · GET/PUT `/auth/me` · PUT `/auth/me/password` · GET `/auth/programas`

## Alumno (`/api/alumno`)
- GET `/alumno/dashboard` · GET `/alumno/catalogo`
- GET/POST `/alumno/solicitudes` · DELETE `/alumno/solicitudes/:id`

## Enlace de Educación Dual (`/api/enlace`)
- GET `/enlace/dashboard`
- Empresas: GET/POST `/enlace/empresas` · PUT `/enlace/empresas/:id` · POST `/enlace/empresas/:id/iniciativas` · PUT/DELETE `/enlace/iniciativas/:id`
- Programas: GET/POST `/enlace/programas` · PUT `/enlace/programas/:id`
- Asignaturas: GET/POST `/enlace/asignaturas?programa=` · PUT `/enlace/asignaturas/:id`
- Competencias: GET/POST `/enlace/competencias?programa=` · PUT/DELETE `/enlace/competencias/:id`
- Planeación: GET/POST `/enlace/planeacion?asignatura=` · PUT/DELETE `/enlace/planeacion/:id`
- Usuarios: GET `/enlace/usuarios?rol=` · POST `/enlace/usuarios` · PUT `/enlace/usuarios/:id`
- GET `/enlace/mentores`
- Solicitudes: GET `/enlace/solicitudes?estatus=` · PUT `/enlace/solicitudes/:id`
- GET `/enlace/alumnos-sin-asignar`
- Asignaciones: GET/POST `/enlace/asignaciones` · PUT `/enlace/asignaciones/:id/mentores` · PUT `/enlace/asignaciones/:id/estatus`

## Compartidas (`/api`)
- GET `/mis-asignaciones` · GET `/asignaciones/:id`
- Formatos: GET/PUT `/formatos/:id` · POST `/formatos/:id/enviar` · PUT `/formatos/:id/revisar` · GET `/revision?estatus=` · GET `/formatos/:id/imprimible`
- Actividades: GET/POST `/asignaciones/:id/actividades` · PUT/DELETE `/actividades/:id`
- Puestos: POST `/asignaciones/:id/puestos` · PUT/DELETE `/puestos/:id`
- Evaluación: GET `/asignaciones/:id/evaluacion/:parcial` · PUT `/actividades/:id/desempeno` · PUT `/formatos/:id/retroalimentacion` · POST `/formatos/:id/cerrar-evaluacion` · GET/PUT `/asignaciones/:id/cierre-o`

> Generado a partir de las rutas del backend actual. Si una API nueva cambia una ruta o un campo, se anota aquí.
