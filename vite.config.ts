import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function resolveLibraryDir(): string {
  const localLib = path.resolve(process.cwd(), 'local_assets/character_library')
  if (fs.existsSync(localLib)) return localLib
  return path.resolve(process.cwd(), 'public/images/characters/library')
}

function getContentTypeByExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.webp') return 'image/webp'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.json') return 'application/json; charset=utf-8'
  return 'application/octet-stream'
}

function toWebpFileName(name: string): string {
  const safeName = path.basename(name).replace(/[^a-zA-Z0-9_.-]/g, '_')
  const stem = safeName.replace(/\.(png|jpg|jpeg|webp)$/i, '')
  return `${stem}.webp`
}

async function optimizeImageToWebp(
  srcPath: string,
  dstPath: string,
  kind: string,
  options: { avatar180?: boolean; deleteSrc?: boolean } = {}
): Promise<void> {
  const { execFileSync } = await import('node:child_process')
  const optimizer = path.resolve(process.cwd(), 'scripts/image_optimizer.py')
  const args = [optimizer, '--kind', kind]
  if (options.avatar180) args.push('--avatar-180')
  if (options.deleteSrc) args.push('--delete-src')
  args.push(srcPath, dstPath)
  execFileSync('python', args, { encoding: 'utf8' })
}

/**
 * PRTS Editor Studio 로컬 파일 시스템 연동 미들웨어 플러그인 (개발 서버 전용)
 * - 브라우저 편집기(#/studio)에서 업로드/크롭한 이미지를 자동으로 WebP로 최적화하여
 *   로컬 디스크에 직접 저장하고, local_assets/character_library를 개발 서버에서 서빙합니다.
 */
function prtsEditorApiPlugin(): Plugin {
  return {
    name: 'prts-editor-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        // Fallback static asset resolver for character illustrations, avatars and local library
        const urlClean = req.url.split('?')[0].replace(/^(\.\/|\/)+/, '/')
        const libDir = resolveLibraryDir()

        // Disable browser caching for character avatars, standing CGs and in-game scenes in development
        if (
          urlClean.startsWith('/images/characters/') ||
          urlClean.startsWith('/images/cgs/') ||
          urlClean.startsWith('/images/backgrounds/')
        ) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
          res.setHeader('Pragma', 'no-cache')
          res.setHeader('Expires', '0')
        }
        if (urlClean.startsWith('/images/characters/library/')) {
          const relSub = decodeURIComponent(urlClean.replace(/^\/images\/characters\/library\//, ''))
          const resolved = path.resolve(libDir, relSub)
          if (resolved.startsWith(libDir) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
            res.setHeader('Content-Type', getContentTypeByExt(resolved))
            return fs.createReadStream(resolved).pipe(res)
          }
          const webpFallback = resolved.replace(/\.(png|jpg|jpeg)$/i, '.webp')
          if (webpFallback.startsWith(libDir) && fs.existsSync(webpFallback)) {
            res.setHeader('Content-Type', 'image/webp')
            return fs.createReadStream(webpFallback).pipe(res)
          }
        } else if (urlClean.startsWith('/images/characters/illust/')) {
          const fn = decodeURIComponent(path.basename(urlClean))
          const stem = fn.replace(/\.(png|jpg|jpeg|webp)$/i, '')
          for (const candidateFn of [fn, `${stem}.webp`, `${stem}.png`]) {
            const target = path.resolve(process.cwd(), 'public/images/characters/illust', candidateFn)
            if (fs.existsSync(target)) {
              res.setHeader('Content-Type', getContentTypeByExt(target))
              return fs.createReadStream(target).pipe(res)
            }
          }
          for (const sub of ['npcs', 'named_characters', 'operators']) {
            for (const candidateFn of [fn, `${stem}.webp`, `${stem}.png`]) {
              const fallback = path.resolve(libDir, sub, candidateFn)
              if (fs.existsSync(fallback)) {
                res.setHeader('Content-Type', getContentTypeByExt(fallback))
                return fs.createReadStream(fallback).pipe(res)
              }
            }
          }
        } else if (urlClean.startsWith('/images/characters/')) {
          const fn = decodeURIComponent(path.basename(urlClean))
          const stem = fn.replace(/\.(png|jpg|jpeg|webp)$/i, '')
          for (const candidateFn of [fn, `${stem}.webp`, `${stem}.png`]) {
            const target = path.resolve(process.cwd(), 'public/images/characters', candidateFn)
            if (fs.existsSync(target)) {
              res.setHeader('Content-Type', getContentTypeByExt(target))
              return fs.createReadStream(target).pipe(res)
            }
          }
          for (const candidateFn of [fn, `${stem}.webp`, `${stem}.png`]) {
            const libAv = path.resolve(libDir, 'avatars', candidateFn)
            if (fs.existsSync(libAv)) {
              res.setHeader('Content-Type', getContentTypeByExt(libAv))
              return fs.createReadStream(libAv).pipe(res)
            }
          }
        }

        if (!req.url.startsWith('/__prts_admin_api/')) {
          return next()
        }

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        console.log(`[PRTS Admin API] ${req.method} ${req.url}`)

        const sendJson = (status: number, data: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
        }

        const readBody = (): Promise<string> =>
          new Promise((resolve, reject) => {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', () => resolve(body))
            req.on('error', reject)
          })

        try {
          if (req.url === '/__prts_admin_api/ping' && req.method === 'GET') {
            return sendJson(200, { ok: true, mode: 'local-fs' })
          }

          if (req.url === '/__prts_admin_api/list-assets' && req.method === 'GET') {
            const pubDir = path.resolve(process.cwd(), 'public/images')
            const scanDir = (absDir: string) => {
              if (!fs.existsSync(absDir)) return []
              return fs
                .readdirSync(absDir)
                .filter((f) => {
                  const full = path.join(absDir, f)
                  return !fs.statSync(full).isDirectory() && /\.(png|jpg|jpeg|webp)$/i.test(f)
                })
                .sort()
            }
            const scan = (sub: string) => scanDir(path.join(pubDir, sub))
            const libraryOps = scanDir(path.join(libDir, 'operators'))
            const libraryNpcs = scanDir(path.join(libDir, 'npcs'))
            const libraryNamed = scanDir(path.join(libDir, 'named_characters'))
            const libraryAvatars = scanDir(path.join(libDir, 'avatars'))

            return sendJson(200, {
              ok: true,
              avatars: Array.from(new Set([...scan('characters'), ...libraryAvatars])).sort(),
              illusts: Array.from(new Set([...scan('characters/illust'), ...libraryOps, ...libraryNpcs, ...libraryNamed])).sort(),
              libraryOperators: libraryOps,
              libraryNpcs: libraryNpcs,
              libraryNamed: libraryNamed,
              libraryAvatars: libraryAvatars,
              cgs: scan('cgs'),
              backgrounds: scan('backgrounds'),
              banners: scan('banners'),
              storyCovers: scan('story_covers'),
            })
          }

          if (req.url === '/__prts_admin_api/upload-asset' && req.method === 'POST') {
            const raw = await readBody()
            const { fileName, dataUrl, subDir } = JSON.parse(raw) as {
              fileName: string
              dataUrl: string
              subDir?: 'illust' | 'avatar' | 'cgs' | 'backgrounds'
            }
            if (!fileName || !dataUrl || !dataUrl.startsWith('data:')) {
              return sendJson(400, { ok: false, error: '유효하지 않은 파일 데이터입니다.' })
            }
            const finalName = toWebpFileName(fileName)
            let targetDir = 'public/images/characters/illust'
            let publicUrlPrefix = '/images/characters/illust'
            let optKind = 'illust'
            if (subDir === 'avatar') {
              targetDir = 'public/images/characters'
              publicUrlPrefix = '/images/characters'
              optKind = 'avatar'
            } else if (subDir === 'cgs') {
              targetDir = 'public/images/cgs'
              publicUrlPrefix = '/images/cgs'
              optKind = 'cg'
            } else if (subDir === 'backgrounds') {
              targetDir = 'public/images/backgrounds'
              publicUrlPrefix = '/images/backgrounds'
              optKind = 'bg'
            }

            const absDir = path.resolve(process.cwd(), targetDir)
            if (!fs.existsSync(absDir)) {
              fs.mkdirSync(absDir, { recursive: true })
            }

            const targetPath = path.resolve(absDir, finalName)
            const tempRawPath = path.resolve(absDir, `._tmp_upload_${Date.now()}_${path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_')}`)
            const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '')
            fs.writeFileSync(tempRawPath, Buffer.from(base64Data, 'base64'))
            try {
              await optimizeImageToWebp(tempRawPath, targetPath, optKind, {
                avatar180: subDir === 'avatar',
                deleteSrc: true,
              })
            } catch {
              if (fs.existsSync(tempRawPath)) fs.renameSync(tempRawPath, targetPath)
            }
            console.log(`[PRTS Admin API] Uploaded asset optimized to WebP: ${targetPath}`)
            return sendJson(200, {
              ok: true,
              fileName: finalName,
              url: `${publicUrlPrefix}/${finalName}`,
              targetPath,
            })
          }

          if (req.url === '/__prts_admin_api/assign-direct-avatar' && req.method === 'POST') {
            const raw = await readBody()
            const { sourcePathOrDataUrl, fileName } = JSON.parse(raw) as {
              sourcePathOrDataUrl: string
              fileName: string
            }
            if (!fileName || !sourcePathOrDataUrl) {
              return sendJson(400, { ok: false, error: '파일명 또는 소스 데이터가 누락되었습니다.' })
            }
            const finalName = toWebpFileName(fileName)
            const targetPath = path.resolve(process.cwd(), 'public/images/characters', finalName)

            if (sourcePathOrDataUrl.startsWith('data:')) {
              const base64Data = sourcePathOrDataUrl.replace(/^data:[^;]+;base64,/, '')
              const tempPath = path.resolve(process.cwd(), 'public/images/characters', `_tmp_${finalName}`)
              fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'))
              try {
                await optimizeImageToWebp(tempPath, targetPath, 'avatar', {
                  avatar180: true,
                  deleteSrc: true,
                })
              } catch {
                if (fs.existsSync(tempPath)) fs.renameSync(tempPath, targetPath)
              }
            } else {
              const cleanSource = sourcePathOrDataUrl.replace(/^(\.\/|\/)+/, '')
              const baseName = path.basename(cleanSource)
              const stem = baseName.replace(/\.(png|jpg|jpeg|webp)$/i, '')
              const candidates = [
                path.resolve(process.cwd(), 'public', cleanSource),
                path.resolve(libDir, 'avatars', baseName),
                path.resolve(libDir, 'avatars', `${stem}.webp`),
                path.resolve(libDir, 'named_characters', baseName),
                path.resolve(libDir, 'named_characters', `${stem}.webp`),
                path.resolve(libDir, 'npcs', baseName),
                path.resolve(libDir, 'npcs', `${stem}.webp`),
                path.resolve(libDir, 'operators', baseName),
                path.resolve(libDir, 'operators', `${stem}.webp`),
              ]
              const absSource = candidates.find((p) => fs.existsSync(p))
              if (!absSource) return sendJson(400, { ok: false, error: `소스 파일 없음: ${cleanSource}` })
              try {
                await optimizeImageToWebp(absSource, targetPath, 'avatar', { avatar180: true })
              } catch {
                fs.copyFileSync(absSource, targetPath)
              }
            }

            console.log(`[PRTS Admin API] Direct avatar assigned & optimized (180x180 WebP): ${targetPath}`)
            return sendJson(200, {
              ok: true,
              fileName: finalName,
              avatarUrl: `/images/characters/${finalName}`,
            })
          }

          if (req.url === '/__prts_admin_api/save-avatar-crop' && req.method === 'POST') {
            const raw = await readBody()
            const { fileName, dataUrl } = JSON.parse(raw) as {
              fileName: string
              dataUrl: string
            }
            if (!fileName || !dataUrl || !/^data:image\/(png|webp|jpeg);base64,/.test(dataUrl)) {
              return sendJson(400, { ok: false, error: '유효하지 않은 이미지 데이터입니다.' })
            }
            const finalName = toWebpFileName(fileName)
            const targetPath = path.resolve(process.cwd(), 'public/images/characters', finalName)
            const tempPath = path.resolve(process.cwd(), 'public/images/characters', `_tmp_crop_${Date.now()}`)
            const base64Data = dataUrl.replace(/^data:image\/[^;]+;base64,/, '')
            fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'))
            try {
              await optimizeImageToWebp(tempPath, targetPath, 'avatar', {
                avatar180: true,
                deleteSrc: true,
              })
            } catch {
              if (fs.existsSync(tempPath)) fs.renameSync(tempPath, targetPath)
            }
            console.log(`[PRTS Admin API] Avatar crop saved as WebP: ${targetPath}`)
            return sendJson(200, {
              ok: true,
              fileName: finalName,
              avatarUrl: `/images/characters/${finalName}`,
            })
          }

          if (req.url === '/__prts_admin_api/crop-avatar-coords' && req.method === 'POST') {
            const raw = await readBody()
            const { sourceSubpath, fileName, focusX, focusY, zoom } = JSON.parse(raw) as {
              sourceSubpath: string
              fileName: string
              focusX: number
              focusY: number
              zoom: number
            }
            const cleanSource = sourceSubpath.replace(/^(\/|\.\/)+/, '')
            const baseName = path.basename(cleanSource)
            const stem = baseName.replace(/\.(png|jpg|jpeg|webp)$/i, '')
            const candidates = [
              path.resolve(process.cwd(), 'public', cleanSource),
              path.resolve(process.cwd(), 'public', cleanSource.replace(/\.(png|jpg|jpeg)$/i, '.webp')),
              path.resolve(libDir, 'npcs', baseName),
              path.resolve(libDir, 'npcs', `${stem}.webp`),
              path.resolve(libDir, 'named_characters', baseName),
              path.resolve(libDir, 'named_characters', `${stem}.webp`),
              path.resolve(libDir, 'operators', baseName),
              path.resolve(libDir, 'operators', `${stem}.webp`),
              path.resolve(libDir, 'avatars', baseName),
              path.resolve(libDir, 'avatars', `${stem}.webp`),
            ]
            const absSource = candidates.find((p) => fs.existsSync(p))
            if (!absSource) {
              return sendJson(400, { ok: false, error: `소스 파일 없음: ${cleanSource}` })
            }
            const finalName = toWebpFileName(fileName)
            const targetPath = path.resolve(process.cwd(), 'public/images/characters', finalName)

            const { execFileSync } = await import('node:child_process')
            const pyCode = `import sys\nfrom PIL import Image\nsrc, dst, fx, fy, z = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])\nimg = Image.open(src).convert('RGBA')\niw, ih = img.size\ncrop_size = min(iw, ih) / max(0.25, z)\ncx, cy = (fx / 100.0) * iw, (fy / 100.0) * ih\nl, t = cx - crop_size / 2.0, cy - crop_size / 2.0\ncropped = img.crop((int(l), int(t), int(l + crop_size), int(t + crop_size)))\ncropped.resize((180, 180), Image.Resampling.LANCZOS).save(dst, 'WEBP', quality=88, method=6)\nprint('DONE')`
            execFileSync('python', ['-c', pyCode, absSource, targetPath, String(focusX), String(focusY), String(zoom)], { encoding: 'utf8' })
            console.log(`[PRTS Admin API] Avatar cropped via PIL to WebP: ${targetPath}`)
            return sendJson(200, {
              ok: true,
              fileName: finalName,
              avatarUrl: `/images/characters/${finalName}`,
            })
          }

          if (req.url === '/__prts_admin_api/save-cg-assets' && req.method === 'POST') {
            const raw = await readBody()
            const { tsCode } = JSON.parse(raw) as { tsCode: string }
            if (!tsCode) return sendJson(400, { ok: false, error: 'tsCode 누락' })
            const targetPath = path.resolve(process.cwd(), 'src/data/db/characterCgAssets.ts')
            fs.writeFileSync(targetPath, tsCode, 'utf8')
            return sendJson(200, { ok: true, path: 'src/data/db/characterCgAssets.ts' })
          }

          if (req.url === '/__prts_admin_api/save-master-db' && req.method === 'POST') {
            const raw = await readBody()
            const { tsCode } = JSON.parse(raw) as { tsCode: string }
            if (!tsCode) return sendJson(400, { ok: false, error: 'tsCode 누락' })
            const targetPath = path.resolve(process.cwd(), 'src/data/db/characterMasterDb.ts')
            fs.writeFileSync(targetPath, tsCode, 'utf8')
            return sendJson(200, { ok: true, path: 'src/data/db/characterMasterDb.ts' })
          }

          if (req.url === '/__prts_admin_api/save-story' && req.method === 'POST') {
            const raw = await readBody()
            const { storyId, tsCode } = JSON.parse(raw) as { storyId: string; tsCode: string }
            if (!storyId || !tsCode) {
              return sendJson(400, { ok: false, error: 'storyId 또는 tsCode 누락' })
            }
            const safeId = path.basename(storyId).replace(/[^a-zA-Z0-9_-]/g, '')
            const targetPath = path.resolve(process.cwd(), 'src/data/stories', `${safeId}.ts`)
            fs.writeFileSync(targetPath, tsCode, 'utf8')
            return sendJson(200, { ok: true, path: `src/data/stories/${safeId}.ts` })
          }

          if (req.url === '/__prts_admin_api/git-status' && req.method === 'GET') {
            const { execSync } = await import('node:child_process')
            try {
              const statusRaw = execSync('git status --porcelain', { encoding: 'utf8', cwd: process.cwd() })
              const branchRaw = execSync('git branch --show-current', { encoding: 'utf8', cwd: process.cwd() }).trim()
              const headRaw = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim()
              let unpushedCount = 0
              try {
                const unpushedRaw = execSync('git rev-list --count origin/main..HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim()
                unpushedCount = parseInt(unpushedRaw, 10) || 0
              } catch {}
              const changedLines = statusRaw.split('\n').map((l) => l.trim()).filter(Boolean)
              return sendJson(200, {
                ok: true,
                clean: changedLines.length === 0,
                changedCount: changedLines.length,
                branch: branchRaw,
                commit: headRaw,
                unpushedCount,
                files: changedLines.slice(0, 30),
              })
            } catch (gitErr) {
              const errMsg = gitErr instanceof Error ? gitErr.message : String(gitErr)
              return sendJson(500, { ok: false, error: errMsg })
            }
          }

          if (req.url === '/__prts_admin_api/git-commit' && req.method === 'POST') {
            const raw = await readBody()
            const { message, push = true } = (raw ? JSON.parse(raw) : {}) as { message?: string; push?: boolean }
            const { execSync } = await import('node:child_process')

            try {
              const statusRaw = execSync('git status --porcelain', { encoding: 'utf8', cwd: process.cwd() })
              const changedLines = statusRaw.split('\n').map((l) => l.trim()).filter(Boolean)
              if (changedLines.length === 0) {
                const head = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim()
                return sendJson(200, {
                  ok: true,
                  noChanges: true,
                  commitHash: head,
                  message: '커밋할 변경 사항이 없습니다 (이미 최신 상태).',
                })
              }

              // 1. Stage all tracked and new non-ignored files
              execSync('git add -A', { encoding: 'utf8', cwd: process.cwd() })

              // 2. Commit with message
              const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
              const commitMsg =
                (message && message.trim()) ||
                `feat(studio): PRTS Studio 캐릭터 DB 및 스토리 에셋 업데이트 (${now})`

              // Escape double quotes for shell
              const safeMsg = commitMsg.replace(/"/g, '\\"')
              const commitOut = execSync(`git commit -m "${safeMsg}"`, {
                encoding: 'utf8',
                cwd: process.cwd(),
              })

              const newHead = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim()
              console.log(`[PRTS Admin API] Git commit created: [${newHead}] ${commitMsg}`)

              let pushed = false
              let pushError = null
              if (push) {
                try {
                  console.log(`[PRTS Admin API] Pushing commit [${newHead}] to GitHub...`)
                  execSync('git push origin HEAD', { encoding: 'utf8', cwd: process.cwd() })
                  pushed = true
                  console.log(`[PRTS Admin API] Successfully pushed to GitHub!`)
                } catch (pushErr) {
                  pushError = pushErr instanceof Error ? pushErr.message : String(pushErr)
                  console.warn(`[PRTS Admin API] Git push warning:`, pushError)
                }
              }

              return sendJson(200, {
                ok: true,
                commitHash: newHead,
                message: commitMsg,
                pushed,
                pushError,
                stdout: commitOut,
              })
            } catch (commitErr) {
              const errMsg = commitErr instanceof Error ? commitErr.message : String(commitErr)
              console.error('[PRTS Admin API] Git commit failed:', errMsg)
              return sendJson(500, { ok: false, error: errMsg })
            }
          }

          if (req.url === '/__prts_admin_api/git-push' && req.method === 'POST') {
            const { execSync } = await import('node:child_process')
            try {
              console.log('[PRTS Admin API] Running git push origin HEAD...')
              const stdout = execSync('git push origin HEAD', { encoding: 'utf8', cwd: process.cwd() })
              return sendJson(200, { ok: true, stdout })
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              console.error('[PRTS Admin API] Git push failed:', msg)
              return sendJson(500, { ok: false, error: msg })
            }
          }

          return sendJson(404, { ok: false, error: 'Unknown endpoint' })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return sendJson(500, { ok: false, error: message })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), prtsEditorApiPlugin()],
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three'
          }
          if (id.includes('node_modules/')) {
            return 'vendor-core'
          }
          if (id.includes('src/data/terraHexGrid') || id.includes('src/data/terraRegions')) {
            return 'data-terra-map'
          }
        },
      },
    },
  },
})
