# Markey

**Branch `hosted`:** static marketing site at `/` (model link goes to Hugging Face). There is **no** `/demo` upload UI on this branch — that lives on **`main`**.

Backend pipeline (on `main` and for local API work): upload a 3D mesh (`.stl`, `.obj`, `.glb`), render orthographic views, slice to G-code with CuraEngine, classify G-code via your inference API, and show policy-style insights (optional Gemini copy on the demo page).

---

## Prerequisites (all platforms)

| Requirement | Notes |
|-------------|--------|
| **Node.js** | v20+ recommended (matches Dockerfile / CI expectations). |
| **Python** | 3.11+ with `pip`. Used for mesh rendering, STL export, and G-code classification. |
| **Git** | To clone the repository. |

---

## 1. Clone and enter the repo

```bash
git clone <your-repo-url> markey
cd markey
```

---

## 2. Python backend (mesh + classification)

Install dependencies from the repo root (or from `backend/`):

**macOS / Linux**

```bash
cd backend
python3 -m pip install -r requirements.txt
cd ..
```

**Windows** (use the Python launcher if `python3` is not on PATH)

```bash
cd backend
py -3 -m pip install -r requirements.txt
cd ..
```

These packages power:

- `render_stl_views.py` — six orthographic PNGs (numpy, trimesh, matplotlib)
- `export_mesh_stl.py` — STL for the slicer
- `classify_gcode_vast.py` — HTTP client to your G-code classifier API

---

## 3. Inference API (G-code model)

The analyze pipeline calls your deployed classifier over HTTPS.

1. Run your FastAPI (or compatible) service that exposes at least:
   - `GET /health` — JSON including `{ "ok": true }` when ready  
   - `POST /predict` — body like `{ "gcode_text": "<file contents>", "threshold": 0.5 }`, returns classification JSON

2. Create **`backend/.env`** (this file is gitignored). Example:

```env
# Required: base URL of your classifier (no trailing slash)
VAST_PUBLIC_API_BASE_URL=https://your-api.example.com

# Optional
# VAST_DEBUG=1
```

If `VAST_PUBLIC_API_BASE_URL` is unset, the code may fall back to a default URL in `classify_gcode_vast.py` — **you should set this to your own endpoint** for any real use.

**macOS note:** If HTTPS calls fail with certificate errors, install certificates for your Python install (e.g. run the “Install Certificates” command that ships with the python.org macOS installer), or align with how your team handles SSL in dev.

---

## 4. CuraEngine (slicing)

Definitions under `slicer/` target **CuraEngine 5.x**-style settings. The app resolves the binary in this order (see `slicer/convert.js`):

### macOS

1. Install **[UltiMaker Cura](https://ultimaker.com/software/ultimaker-cura/)** and keep the app in **`/Applications`** (default).
2. The script uses:  
   `/Applications/UltiMaker Cura.app/Contents/Frameworks/CuraEngine`
3. Optional: place a compatible **`CuraEngine.macos-arm64`** (or x86_64) under `slicer/cura/bin/` and ensure it is executable.  
   **Note:** `slicer/cura/bin/` and `slicer/cura/lib/` are listed in `.gitignore`; fresh clones will not include bundled engines unless you add them locally.

### Windows

1. Prefer **`CuraEngine.exe`** in `slicer/cura/bin/` (same gitignore caveat — add the file locally if not in your clone).
2. Or install UltiMaker Cura and point the app at its `CuraEngine.exe` by setting **`CURAENGINE_BIN`** to the full path when you run Node (or ensure the bundled path exists).

### Optional environment variable

- **`CURAENGINE_BIN`** — absolute path to the `CuraEngine` / `CuraEngine.exe` binary if auto-detection fails.

---

## 5. Frontend environment

On **`main`**, the `/demo` page can call Google Gemini for narrative fields. Set **`frontend/.env.local`** with `GEMINI_API_KEY=...` if you use that flow.

**`hosted`** does not ship `/demo` or `/api/demo-insights`; no Gemini key is required for the marketing site.

---

## 6. Install npm dependencies and run the dev server

From the **repository root**:

```bash
cd frontend
npm install
npm run dev
```

Then open **[http://localhost:3000](http://localhost:3000)**.

- Marketing / FAQ / results: **`/`**

**Windows:** Same commands in PowerShell or CMD from `frontend\`:

```bat
cd frontend
npm install
npm run dev
```

---

## 7. Quick verification checklist

| Step | Check |
|------|--------|
| Python | `python3 --version` or `py -3 --version` |
| Backend deps | `python3 -m pip show trimesh` (or `py -3 -m pip show trimesh`) |
| `backend/.env` | `VAST_PUBLIC_API_BASE_URL` points at a live API |
| Cura | macOS: UltiMaker Cura in `/Applications`; Windows: `CuraEngine.exe` in `slicer/cura/bin` or `CURAENGINE_BIN` |
| Frontend (`main`) | Optional: `frontend/.env.local` with `GEMINI_API_KEY` for `/demo` copy |
| Dev server | `npm run dev` in `frontend`, open **`/`** (on `hosted`; on `main` you can also use **`/demo`**) |

---

## Production build (reference)

```bash
cd frontend
npm run build
npm start
```

For **`hosted`**, production is typically a static Next.js deploy without the Python/Cura **`/api/analyze`** pipeline. On **`main`**, a full-stack host needs **Python**, **CuraEngine**, and classifier network access for `/demo` and `/api/analyze`.

---

## Linux

If you develop on Linux, use a **CuraEngine 5.x** binary compatible with your distro and either place it under `slicer/cura/bin/` or set **`CURAENGINE_BIN`**. Avoid distro packages that ship only CuraEngine 4.x; they often mismatch `fdmprinter.def.json` and fail with missing-setting errors.
