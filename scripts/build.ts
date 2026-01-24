// Program that builds the project, copies artifacts, locates the compiled binary and WebView2 DLL, and packages them into a distribution folder

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const ARGS = process.argv.slice(2)
const IS_RELEASE = ARGS.includes('--release')
const ROOT = process.cwd()
const WINDOW_DIR = path.join(ROOT, 'window')
const DIST_DIR = path.join(ROOT, 'dist')
const PACKAGE_DIR = path.join(ROOT, 'package')
const DESIRED_BASE = 'Simulador de Memoria'

function log(...s: any[]) {
  console.log(...s)
}

// Execute a shell command and log it
function run(cmd: string, cwd = ROOT) {
  log(`> ${cmd}  (cwd=${cwd})`)
  execSync(cmd, { stdio: 'inherit', cwd })
}

/* ---------- Robust remove + backup ---------- */
// Safely check if a path exists, handling possible errors
function exists(p: string) {
  try {
    return fs.existsSync(p)
  } catch {
    return false
  }
}

// Attempt native removal using fs.rmSync
function tryRmSync(p: string) {
  try {
    fs.rmSync(p, { recursive: true, force: true })
    return true
  } catch (e) {
    return false
  }
}

// Attempt removal on Windows using cmd or PowerShell
function tryCmdRmWindows(p: string) {
  try {
    // use rd (remove directory) — only works when p is directory
    execSync(`cmd /c rd /s /q "${p}"`, { stdio: 'ignore' })
    return true
  } catch {
    try {
      // powershell fallback, more forceful
      execSync(
        `powershell -NoProfile -Command "Remove-Item -LiteralPath '${p}' -Recurse -Force -ErrorAction SilentlyContinue"`,
        { stdio: 'ignore' }
      )
      return true
    } catch {
      return false
    }
  }
}

// Attempt removal on Unix-like systems using rm -rf
function tryRmUnix(p: string) {
  try {
    execSync(`rm -rf "${p}"`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Safely remove a path with multiple fallback strategies
function safeRemove(p: string) {
  if (!exists(p)) return

  // 1) try native fs.rmSync
  if (tryRmSync(p)) {
    log(`→ Removed (fs.rmSync) ${p}`)
    return
  }

  // 2) platform-specific attempts
  if (process.platform === 'win32') {
    if (tryCmdRmWindows(p)) {
      log(`→ Removed (cmd/PowerShell) ${p}`)
      return
    }
  } else {
    if (tryRmUnix(p)) {
      log(`→ Removed (rm -rf) ${p}`)
      return
    }
  }

  // 3) last resort: try to rename the item (if locked, rename may also fail)
  const bak = `${p}.bak.${Date.now()}`
  try {
    fs.renameSync(p, bak)
    log(`→ Renamed locked item to: ${bak}`)
    return
  } catch (err) {
    // give actionable error with common causes
    throw new Error(
      `No se pudo eliminar ni renombrar '${p}'. Razones comunes:\n` +
        ` - Existe un archivo (no carpeta) llamado 'package'\n` +
        ` - Un proceso (Explorer, antivirus, tu app) tiene archivos abiertos dentro\n` +
        ` - Permisos insuficientes (prueba ejecutar en PowerShell como administrador)\n\n` +
        `Intentos automáticos realizados: fs.rmSync, cmd rd, PowerShell Remove-Item, rm -rf, rename. Error original: ${(err as Error).message}`
    )
  }
}

/* ---------- FS helpers ---------- */
// Ensure a directory exists, creating it recursively if needed
function mkdirp(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}
// Copy a file, creating parent directories as needed
function copyFile(src: string, dest: string) {
  mkdirp(path.dirname(dest))
  fs.copyFileSync(src, dest)
}
// Recursively copy files and directories
function copyRecursive(src: string, dest: string) {
  const st = fs.statSync(src)
  if (st.isDirectory()) {
    mkdirp(dest)
    for (const ent of fs.readdirSync(src)) {
      copyRecursive(path.join(src, ent), path.join(dest, ent))
    }
  } else {
    copyFile(src, dest)
  }
}
// Recursively find files that satisfy a predicate
function findFiles(dir: string, predicate: (p: string) => boolean): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...findFiles(full, predicate))
    else if (entry.isFile() && predicate(full)) out.push(full)
  }
  return out
}

/* ---------- Main flow ---------- */
try {
  // Build the project using pnpm
  run('pnpm build', ROOT)

  // Copy dist -> window/dist
  const windowDist = path.join(WINDOW_DIR, 'dist')
  if (exists(windowDist)) safeRemove(windowDist)
  copyRecursive(DIST_DIR, windowDist)
  log('→ Copiado dist -> window/dist')

  // Build the Rust binary with Cargo
  run(IS_RELEASE ? 'cargo build --release' : 'cargo build', WINDOW_DIR)

  // Locate the compiled .exe binary
  const profile = IS_RELEASE ? 'release' : 'debug'
  const profileDir = path.join(WINDOW_DIR, 'target', profile)
  let exeCandidates = findFiles(profileDir, (p) => p.toLowerCase().endsWith('.exe'))
  if (exeCandidates.length === 0)
    exeCandidates = findFiles(path.join(WINDOW_DIR, 'target'), (p) =>
      p.toLowerCase().endsWith('.exe')
    )

  // Try to read Cargo.toml to get the crate name
  let preferredName: string | null = null
  try {
    const toml = fs.readFileSync(path.join(WINDOW_DIR, 'Cargo.toml'), 'utf8')
    const m = toml.match(/^\s*name\s*=\s*["'](.+?)["']/m)
    if (m) preferredName = m[1]
  } catch {}

  // Choose the most appropriate binary
  let binPath: string | null = null
  if (preferredName) {
    const match = exeCandidates.find((p) =>
      path.basename(p).toLowerCase().startsWith(preferredName!.toLowerCase())
    )
    if (match) binPath = match
  }
  if (!binPath && exeCandidates.length > 0) {
    exeCandidates.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)
    binPath = exeCandidates[0]
  }
  if (!binPath)
    throw new Error("No se encontró binario (.exe) en target. Revisa la salida de 'cargo build'.")

  log('→ Binario encontrado:', binPath)

  // Locate WebView2Loader.dll for the current architecture
  const archMap: Record<string, string> = { x64: 'x64', ia32: 'x86', arm64: 'arm64' }
  const nodeArch = process.arch in archMap ? archMap[process.arch] : process.arch
  const targetRoot = path.join(WINDOW_DIR, 'target')

  let dllCandidates = findFiles(
    targetRoot,
    (p) =>
      path.basename(p).toLowerCase() === 'webview2loader.dll' &&
      p.toLowerCase().includes(`${path.sep}out${path.sep}${nodeArch}`)
  )
  if (dllCandidates.length === 0) {
    dllCandidates = findFiles(
      targetRoot,
      (p) => path.basename(p).toLowerCase() === 'webview2loader.dll'
    )
  }
  if (dllCandidates.length === 0) {
    log(
      '⚠ WebView2Loader.dll NO encontrado en target. Si esperas ejecutarlo en Windows, revisa la compilación.'
    )
  } else {
    log('→ WebView2Loader.dll encontrado:', dllCandidates[0])
  }

  // Prepare the package directory (binary renamed + DLL)
  if (exists(PACKAGE_DIR)) safeRemove(PACKAGE_DIR)
  mkdirp(PACKAGE_DIR)

  // Copy and rename the binary
  const origExt = path.extname(binPath) || (process.platform === 'win32' ? '.exe' : '')
  const outBinName = `${DESIRED_BASE}${origExt}`
  const outBinPath = path.join(PACKAGE_DIR, outBinName)
  copyFile(binPath, outBinPath)
  log(`→ Copiado y renombrado binario a: ${outBinPath}`)

  // Ensure executable permission on non‑Windows platforms
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(outBinPath, 0o755)
    } catch {}
  }

  // Copy the DLL if it was found
  if (dllCandidates.length > 0) {
    const dllDest = path.join(PACKAGE_DIR, 'WebView2Loader.dll')
    copyFile(dllCandidates[0], dllDest)
    log(`→ Copiado DLL a: ${dllDest}`)
  }

  // Log final package contents
  log('✔ Empaquetado completado. Contenido de package/:')
  for (const f of fs.readdirSync(PACKAGE_DIR)) {
    const p = path.join(PACKAGE_DIR, f)
    log('   -', f, `(${(fs.statSync(p).size / 1024).toFixed(1)} KB)`)
  }
} catch (err: any) {
  // Report any error that occurred during packaging
  console.error('✖ Error durante empaquetado:', err?.message ?? err)
  process.exit(1)
}
