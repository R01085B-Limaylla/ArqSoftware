# Portafolio (React + Vite) con miniaturas de PDF e imágenes y subida al repo (Vercel API)

## Requisitos
- Node.js 18+
- Cuenta GitHub con Pages (rama `gh-pages` recomendada)
- Cuenta Vercel (gratis)

## Instalar y correr
```bash
npm install
npm run dev
```
Abre `http://localhost:5173`

## Configurar endpoint de subida
Edita `src/App.jsx` y cambia:
```js
const UPLOAD_ENDPOINT = 'https://TU-PROYECTO-VERCEL.vercel.app/api/upload'
```

## Deploy frontend a GitHub Pages
1. En `vite.config.js`, deja `base: './'` o usa `base: '/TU-REPO/'` según tu caso.
2. Compila y sube `dist/` a tu rama `gh-pages`:
```bash
npm run build
# Copia el contenido de dist/ a gh-pages
```

## Backend en Vercel
- Sube la carpeta `api/` con `upload.js`.
- Variables de entorno:
  - `GITHUB_TOKEN` (PAT o token de App con `contents:write`)
  - `GH_OWNER` (usuario/organización)
  - `GH_REPO` (nombre del repo)
  - `GH_BRANCH` (por defecto `gh-pages`)

## Nota CORS y miniaturas PDF
- Las miniaturas PDF funcionan para URLs **same-origin** (servidas desde tu mismo Pages) o `blob:` (archivo subido localmente).
- Para URLs externas sin CORS, se muestra icono PDF (limitación del navegador).

## Credenciales demo
- Usuario: `admin`
- Contraseña: `admin123`
