# ErgoStudy — versión Vite

Adaptación del código de ErgoStudy a **tu estructura Vite** (`proyect/ErgoStudio`).

## Qué cambió respecto a la versión CRA

| CRA (original) | Vite (tu proyecto) |
| --- | --- |
| `react-scripts` + `craco` | `vite` + `@vitejs/plugin-react` |
| `src/index.js` | `src/main.jsx` |
| `src/App.js` | `src/App.jsx` |
| `public/index.html` | `index.html` en la raíz |
| `REACT_APP_BACKEND_URL` | `VITE_BACKEND_URL` (`import.meta.env`) |
| alias `@` en `craco.config.js` | alias `@` en `vite.config.js` |
| `craco start` / `craco build` | `npm run dev` / `npm run build` |

## Archivos que debes copiar a `proyect/ErgoStudio`

```
index.html                  ← reemplaza el de Vite
package.json                ← reemplaza (añade Tailwind, Radix, recharts…)
vite.config.js              ← reemplaza (alias "@" → src)
tailwind.config.js          ← NUEVO (paleta sage / terracotta / amber)
postcss.config.js           ← NUEVO
.eslintrc.json              ← reemplaza (añade react-refresh)
.env                        ← NUEVO
src/main.jsx                ← reemplaza
src/App.jsx                 ← reemplaza (era App.jsx de plantilla)
src/App.css                 ← reemplaza
src/index.css               ← reemplaza (Tailwind + tokens de diseño)
src/components/             ← NUEVA carpeta (9 componentes + ui/)
src/context/                ← NUEVA carpeta
src/lib/                    ← NUEVA carpeta
src/pages/                  ← NUEVA carpeta
```

**No se tocan** (siguen siendo tuyos):
`src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`,
`public/favicon.svg`, `public/icons.svg`, `node_modules/`, `package-lock.json`.

> `src/assets/hero.png` ya se usa como imagen del hero en el Landing
> (`import heroImg from "@/assets/hero.png"`). Si quieres otra imagen,
> reemplaza ese archivo o cambia el import en `src/pages/Landing.jsx`.
>
> ⚠️ `package.json` cambió, así que borra `package-lock.json` y ejecuta
> `npm install` de nuevo para regenerarlo.

## Backend (nuevo, fuera de ErgoStudio)

Se añade como hermano del frontend: `proyect/backend/`

```bash
cd proyect/backend
python3 -m venv .venv
# Windows:  .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

Crea la base SQLite y el usuario demo automáticamente.

## Arrancar el frontend

```bash
cd proyect/ErgoStudio
npm install
npm run dev        # http://localhost:3000
```

El `.env` ya apunta a `http://localhost:8001`.

## Cuenta demo

| Correo | Contraseña |
| --- | --- |
| `demo@ergostudy.app` | `Ergo#2026` |

Viene con ~2 semanas de sesiones precargadas (panel, racha y gráficas con datos).

## Estructura final

```
ergostudy_1/
└── proyect/
    ├── ErgoStudio/          # Frontend (Vite + React 18 + Tailwind)
    │   ├── index.html
    │   ├── vite.config.js
    │   ├── tailwind.config.js
    │   ├── postcss.config.js
    │   ├── package.json
    │   ├── .env
    │   ├── public/          # (tuyo: favicon.svg, icons.svg)
    │   └── src/
    │       ├── assets/      # (tuyo: hero.png, react.svg, vite.svg)
    │       ├── components/  # 9 componentes + ui/ (shadcn)
    │       ├── context/     # AuthContext, ThemeContext
    │       ├── lib/         # api.js, utils.js
    │       ├── pages/       # Landing, AuthPage, AppDashboard
    │       ├── App.jsx
    │       ├── App.css
    │       ├── index.css
    │       └── main.jsx
    └── backend/             # API FastAPI + SQLite
        ├── server.py
        ├── requirements.txt
        └── .env.example
```

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Landing pública |
| `/auth` | Login / registro |
| `/app` | Panel (protegido: redirige a `/auth` sin sesión) |

> ErgoStudy es una herramienta preventiva y educativa. No diagnostica ni
> sustituye la valoración de un profesional de la salud.
