# UTTEC-DUAL — Frontend

React + Vite + Tailwind. Es solo la interfaz: toda la información viene de la API por `/api`
(contrato en [CONTRATO_API.md](CONTRATO_API.md)).

## Ejecutar

```bash
npm install
cp .env.example .env.local   # ajusta VITE_API_PROXY_TARGET si la API no está en localhost:4000
npm run dev                  # http://localhost:5173
```

El frontend necesita una API corriendo. Mientras no estén las 3 APIs nuevas, usa el backend actual
(repo `uttec-dual-backend`, ver su README), ya sea:

1. **Local**: levántalo en tu PC (puerto 4000) → no cambias nada.
2. **Compartido**: si alguien lo tiene en un servidor, pon su URL en `VITE_API_PROXY_TARGET`
   (ej. `http://192.168.1.50:4000`). Ahí solo corres el frontend.

## Variables

| Variable | Uso |
|---|---|
| `VITE_API_PROXY_TARGET` | Destino del proxy `/api` en desarrollo (default `http://localhost:4000`). |
| `VITE_API_BASE` | Opcional: URL absoluta de la API si no se usa proxy (requiere `CORS_ORIGIN` en la API). |

## Producción (on-premise)

`npm run build` genera `dist/`. Sírvelo con el servidor web de la universidad (nginx/IIS) y haz que
reenvíe `/api` a la API (o a cada una de las 3 por prefijo). Con eso el front no cambia.

## Verificación

`npx tsc -b` y `npm run build`.
