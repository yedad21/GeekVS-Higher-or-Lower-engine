# ⚡ GeekVS - Higher or Lower: Power Levels

Un juego web interactivo estilo **Higher or Lower** donde comparas niveles de poder ficticios de personajes de anime, cómics y ficción calculados mediante un algoritmo transitivo recursivo.

---

## 🚀 Inicio Rápido (Desarrollo Local)

Dado que la aplicación utiliza **Módulos ES6 nativos** (`import` / `export`) y peticiones `fetch()` para el catálogo `characters.json`, debe servirse mediante un servidor HTTP local para evitar restricciones de CORS del protocolo `file://`.

### Opción A: Usando Node.js (Recomendado)
```bash
# Sin necesidad de instalación previa:
npx serve .
```
O con `http-server`:
```bash
npx http-server -p 3000
```

### Opción B: Usando Python 3
```bash
python -m http.server 8000
```
Luego abre tu navegador en `http://localhost:8000`.

### Opción C: VS Code Live Server
Haz clic derecho en `index.html` y selecciona **"Open with Live Server"**.

---

## 📁 Estructura del Proyecto

```text
GeekVS/
├── index.html        # Estructura semántica, accesibilidad y contenedores UI
├── style.css         # Diseño Dark Theme responsive con estética anime/geek
├── app.js            # Controlador del ciclo de juego, estado y animaciones
├── powerEngine.js    # Motor de cálculo transitivo recursivo (Factor ALPHA = 0.5)
├── characters.json   # Base de datos modular de personajes y hazañas
├── vercel.json       # Headers de seguridad, enrutamiento limpio y caché para Vercel
├── .gitignore        # Exclusiones estándar para Git
└── README.md         # Documentación del proyecto
```

---

## 🧠 Algoritmo de Nivel de Poder

El puntaje total se calcula de forma recursiva mediante:

$$\text{Score} = \text{Bajas Directas} + \text{Bono Hazaña} + \sum (\text{Score Derrotado}_i \times 0.5)$$

- **Factor $\alpha = 0.5$**: Cada enemigo vencido aporta el 50% de su poder total.
- **Prevención de ciclos**: Usa un `Set` aislado por rama de evaluación para resolver referencias circulares sin bucles infinitos.
- **Resiliencia**: Retorna 0 de manera segura ante identificadores desconocidos o no registrados.

---

## 🌐 Despliegue en GitHub y Vercel

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "feat: initial release of GeekVS"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/GeekVS.git
git push -u origin main
```

### 2. Despliegue en Vercel
1. Ingresa a [Vercel Dashboard](https://vercel.com/dashboard) y haz clic en **"Add New..." > "Project"**.
2. Importa el repositorio `GeekVS` desde tu cuenta de GitHub.
3. En **Framework Preset**, selecciona **Other** (o déjalo en automático, ya que es un sitio estático).
4. Haz clic en **Deploy**.

### 3. Configurar Dominio Personalizado
1. En tu proyecto de Vercel, ve a **Settings > Domains**.
2. Escribe tu dominio (ej. `geekvs.com` o `play.tudominio.com`) y haz clic en **Add**.
3. En el panel de tu proveedor DNS (Cloudflare, Namecheap, GoDaddy, etc.), añade los registros indicados por Vercel:
   - **Para subdominios (CNAME)**: `play` -> `cname.vercel-dns.com`
   - **Para dominios raíz (A)**: `@` -> `76.76.21.21`

---

## 🛠️ Personalización de Datos

Para añadir o modificar personajes, edita `characters.json`:

```json
{
  "id": "personaje_id",
  "nombre": "Nombre del Personaje",
  "obra": "Nombre de la Serie/Anime",
  "bajas_directas": 10,
  "bono_hazana": 5000,
  "derrotados": ["id_enemigo_1", "id_enemigo_2"],
  "imagen": "https://url-de-la-imagen.jpg"
}
```
El motor calculará automáticamente el nuevo `scoreFinal` en tiempo de ejecución.
