import path from 'node:path'
import fs from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'

const TARGET_WIDTH = 640

const repoRoot = process.cwd()
const srcRoot = path.join(repoRoot, 'apps', 'web', 'src', 'shared', 'assets', 'background-collections')
const destRoot = path.join(repoRoot, 'apps', 'web', 'src', 'shared', 'assets', 'background-collections-thumbs')

function isWithinRoot(filePath, rootPath) {
  const relative = path.relative(rootPath, filePath)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function normalizeArgPath(value) {
  if (!value) return null
  const normalized = value.replaceAll('"', '').trim()
  if (!normalized) return null
  if (path.isAbsolute(normalized)) return normalized
  return path.join(repoRoot, normalized)
}

async function listFilesRecursively(rootPath) {
  const entries = await fs.readdir(rootPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(rootPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursively(fullPath))
      continue
    }
    if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

function applyOutputFormat(pipeline, ext) {
  if (ext === '.webp') return pipeline.webp({ quality: 62 })
  if (ext === '.avif') return pipeline.avif({ quality: 50 })
  if (ext === '.png') return pipeline.png({ compressionLevel: 9 })
  if (ext === '.jpg' || ext === '.jpeg') return pipeline.jpeg({ quality: 70, mozjpeg: true })
  return pipeline.webp({ quality: 62 })
}

async function generateThumbForFile(srcAbsolutePath) {
  if (!isWithinRoot(srcAbsolutePath, srcRoot)) {
    throw new Error(`Refusing to process file outside ${srcRoot}: ${srcAbsolutePath}`)
  }

  const relativePath = path.relative(srcRoot, srcAbsolutePath)
  const destAbsolutePath = path.join(destRoot, relativePath)
  const destDir = path.dirname(destAbsolutePath)
  const ext = path.extname(destAbsolutePath).toLowerCase()

  await fs.mkdir(destDir, { recursive: true })

  let pipeline = sharp(srcAbsolutePath)
    .rotate()
    .resize({
      width: TARGET_WIDTH,
      withoutEnlargement: true,
      fit: 'inside',
    })

  pipeline = applyOutputFormat(pipeline, ext)
  await pipeline.toFile(destAbsolutePath)

  return destAbsolutePath
}

async function main() {
  const args = process.argv.slice(2)
  const shouldProcessAll = args.includes('--all')
  const fileArgs = args.filter((arg) => !arg.startsWith('--'))

  const candidates = shouldProcessAll
    ? await listFilesRecursively(srcRoot)
    : fileArgs.map(normalizeArgPath).filter(Boolean)

  const srcFiles = candidates
    .filter((absolutePath) => absolutePath && isWithinRoot(absolutePath, srcRoot))
    .filter((absolutePath) => !absolutePath.includes('background-collections-thumbs'))

  if (!srcFiles.length) {
    return
  }

  const generated = []

  for (const absolutePath of srcFiles) {
    try {
      generated.push(await generateThumbForFile(absolutePath))
    } catch (error) {
      console.error(`Failed generating thumb for ${absolutePath}`)
      throw error
    }
  }

  const uniqueGenerated = Array.from(new Set(generated))
  if (!uniqueGenerated.length) return

  const gitAdd = spawnSync('git', ['add', '--', ...uniqueGenerated], {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  if (gitAdd.status !== 0) {
    process.exit(gitAdd.status ?? 1)
  }
}

main().catch((error) => {
  console.error(error?.stack ?? String(error))
  process.exit(1)
})

