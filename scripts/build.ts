// Program packages the built web app and Rust binary into a distributable directory.

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
const BINARY_NAME = 'window'

// Helper: logs messages to console.
function log(...s: any[]) {
  console.log(...s)
}

// Executes a shell command while logging it.
function run(cmd: string, cwd = ROOT) {
  log(`> ${cmd}  (cwd=${cwd})`)
  execSync(cmd, { stdio: 'inherit', cwd })
}

/* ---------- Robust remove + backup ---------- */
// Checks if a filesystem path exists, safely handling errors.
function exists(p: string) {
  try {
    return fs.existsSync(p)
  } catch {
    return false
  }
}

// Removes a path, falling back to rename if deletion fails.
function safeRemove(p: string) {
  if (!exists(p)) return
  try {
    fs.rmSync(p, { recursive: true, force: true })
    log(`→ Removed ${p}`)
  } catch (err) {
    const bak = `${p}.bak.${Date.now()}`
    try {
      fs.renameSync(p, bak)
      log(`→ Renamed locked item to: ${bak}`)
    } catch {
      throw new Error(`No se pudo eliminar ni renombrar '${p}'`)
    }
  }
}

/* ---------- FS helpers ---------- */
// Ensures a directory exists, creating it recursively if needed.
function mkdirp(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

// Copies a file, creating destination directories as required.
function copyFile(src: string, dest: string) {
  mkdirp(path.dirname(dest))
  fs.copyFileSync(src, dest)
}

/* ---------- Main flow ---------- */
// Main execution block: builds assets, compiles binary, and assembles package.
try {
  // Build the JavaScript/TypeScript project.
  run('pnpm build', ROOT)

  // Copy built web assets into window/dist.
  const windowDist = path.join(WINDOW_DIR, 'dist')
  if (exists(windowDist)) safeRemove(windowDist)
  fs.cpSync(DIST_DIR, windowDist, { recursive: true })
  log('→ Copiado dist -> window/dist')

  // Compile the Rust binary with Cargo.
  run(IS_RELEASE ? 'cargo build --release' : 'cargo build', WINDOW_DIR)

  // Determine the path to the compiled binary.
  const profile = IS_RELEASE ? 'release' : 'debug'
  const profileDir = path.join(WINDOW_DIR, 'target', profile)
  const binaryExt = process.platform === 'win32' ? '.exe' : ''
  const binaryPath = path.join(profileDir, `${BINARY_NAME}${binaryExt}`)

  if (!exists(binaryPath)) {
    throw new Error(`No se encontró el binario en: ${binaryPath}`)
  }

  log('→ Binario encontrado:', binaryPath)

  // Locate WebView2Loader.dll on Windows platforms.
  let dllPath: string | null = null
  if (process.platform === 'win32') {
    const targetRoot = path.join(WINDOW_DIR, 'target')
    const dllFiles = fs
      .readdirSync(targetRoot, { recursive: true })
      .filter(
        (f: any) => typeof f === 'string' && path.basename(f).toLowerCase() === 'webview2loader.dll'
      )

    if (dllFiles.length > 0) {
      dllPath = path.join(targetRoot, dllFiles[0] as string)
      log('→ WebView2Loader.dll encontrado:', dllPath)
    } else {
      log('⚠ WebView2Loader.dll NO encontrado')
    }
  }

  // Prepare the output package directory.
  if (exists(PACKAGE_DIR)) safeRemove(PACKAGE_DIR)
  mkdirp(PACKAGE_DIR)

  // Copy and rename the compiled binary to the package.
  const outBinName = `${DESIRED_BASE}${binaryExt}`
  const outBinPath = path.join(PACKAGE_DIR, outBinName)
  copyFile(binaryPath, outBinPath)
  log(`→ Copiado binario a: ${outBinPath}`)

  // Set executable permissions on Unix-like systems.
  if (process.platform !== 'win32') {
    fs.chmodSync(outBinPath, 0o755)
  }

  // Copy WebView2Loader.dll into the package on Windows.
  if (dllPath) {
    const dllDest = path.join(PACKAGE_DIR, 'WebView2Loader.dll')
    copyFile(dllPath, dllDest)
    log(`→ Copiado DLL a: ${dllDest}`)
  }

  // List final package contents.
  log('✔ Empaquetado completado. Contenido de package/:')
  for (const f of fs.readdirSync(PACKAGE_DIR)) {
    const p = path.join(PACKAGE_DIR, f)
    const size = fs.statSync(p).size / 1024
    log('   -', f, `(${size.toFixed(1)} KB)`)
  }
} catch (err: any) {
  // Handle errors and exit with failure status.
  console.error('✖ Error durante empaquetado:', err?.message ?? err)
  process.exit(1)
}
