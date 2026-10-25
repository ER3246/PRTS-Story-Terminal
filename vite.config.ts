import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * PRTS Editor Studio 로컬 파일 시스템 연동 미들웨어 플러그인 (개발 서버 전용)
 * - 브라우저 편집기(#/studio)에서 크롭한 1:1 아바타 PNG, CG 자산 DB, 캐릭터 마스터 DB, 스토리 TS 파일을
 *   에이전트 없이도 로컬 디스크에 직접 저장할 수 있도록 지원합니다.
 */
function prtsEditorApiPlugin(): Plugin {
  return {
    name: 'prts-editor-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        // Fallback static asset resolver for character illustrations and avatars
        const urlClean = req.url.split('?')[0].replace(/^(\.\/|\/)+/, '/')
        if (urlClean.startsWith('/images/characters/illust/')) {
          const fn = path.basename(urlClean)
          const target = path.resolve(process.cwd(), 'public/images/characters/illust', fn)
          if (!fs.existsSync(target)) {
            const libNpc = path.resolve(process.cwd(), 'public/images/characters/library/npcs', fn)
            const libNamed = path.resolve(process.cwd(), 'public/images/characters/library/named_characters', fn)
            const libOp = path.resolve(process.cwd(), 'public/images/characters/library/operators', fn)
            const fallback = fs.existsSync(libNpc)
              ? libNpc
              : fs.existsSync(libNamed)
              ? libNamed
              : fs.existsSync(libOp)
              ? libOp
              : null
            if (fallback) {
              res.setHeader('Content-Type', 'image/png')
              return fs.createReadStream(fallback).pipe(res)
            }
          }
        } else if (urlClean.startsWith('/images/characters/') && !urlClean.startsWith('/images/characters/library/')) {
          const fn = path.basename(urlClean)
          const target = path.resolve(process.cwd(), 'public/images/characters', fn)
          if (!fs.existsSync(target)) {
            const libAv = path.resolve(process.cwd(), 'public/images/characters/library/avatars', fn)
            if (fs.existsSync(libAv)) {
              res.setHeader('Content-Type', 'image/png')
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
            const scan = (sub: string) => {
              const d = path.join(pubDir, sub)
              if (!fs.existsSync(d)) return []
              return fs
                .readdirSync(d)
                .filter((f) => {
                  const full = path.join(d, f)
                  return !fs.statSync(full).isDirectory() && /\.(png|jpg|jpeg|webp)$/i.test(f)
                })
                .sort()
            }
            const libraryOps = scan('characters/library/operators')
            const libraryNpcs = scan('characters/library/npcs')
            const libraryNamed = scan('characters/library/named_characters')
            const libraryAvatars = scan('characters/library/avatars')

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
            const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_')
            let targetDir = 'public/images/characters/illust'
            let publicUrlPrefix = '/images/characters/illust'
            if (subDir === 'avatar') {
              targetDir = 'public/images/characters'
              publicUrlPrefix = '/images/characters'
            } else if (subDir === 'cgs') {
              targetDir = 'public/images/cgs'
              publicUrlPrefix = '/images/cgs'
            } else if (subDir === 'backgrounds') {
              targetDir = 'public/images/backgrounds'
              publicUrlPrefix = '/images/backgrounds'
            }

            const absDir = path.resolve(process.cwd(), targetDir)
            if (!fs.existsSync(absDir)) {
              fs.mkdirSync(absDir, { recursive: true })
            }

            const targetPath = path.resolve(absDir, safeName)
            const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '')
            fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'))
            console.log(`[PRTS Admin API] Uploaded asset saved: ${targetPath}`)
            return sendJson(200, {
              ok: true,
              fileName: safeName,
              url: `${publicUrlPrefix}/${safeName}`,
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
            const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_')
            const finalName = safeName.endsWith('.png') ? safeName : `${safeName}.png`
            const targetPath = path.resolve(process.cwd(), 'public/images/characters', finalName)

            if (sourcePathOrDataUrl.startsWith('data:')) {
              const base64Data = sourcePathOrDataUrl.replace(/^data:[^;]+;base64,/, '')
              const tempPath = path.resolve(process.cwd(), 'public/images/characters', `_tmp_${finalName}`)
              fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'))
              try {
                const { execFileSync } = await import('node:child_process')
                const pyCode = `import sys\nfrom PIL import Image\nsrc, dst = sys.argv[1], sys.argv[2]\nim = Image.open(src).convert('RGBA')\nim.resize((180, 180), Image.Resampling.LANCZOS).save(dst, 'PNG')\nprint('DONE')`
                execFileSync('python', ['-c', pyCode, tempPath, targetPath], { encoding: 'utf8' })
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
              } catch {
                if (fs.existsSync(tempPath)) fs.renameSync(tempPath, targetPath)
              }
            } else {
              const cleanSource = sourcePathOrDataUrl.replace(/^(\.\/|\/)+/, '')
              let absSource = path.resolve(process.cwd(), 'public', cleanSource)
              if (!fs.existsSync(absSource)) {
                const baseName = path.basename(cleanSource)
                const candidates = [
                  path.resolve(process.cwd(), 'public/images/characters/library/avatars', baseName),
                  path.resolve(process.cwd(), 'public/images/characters/library/named_characters', baseName),
                  path.resolve(process.cwd(), 'public/images/characters/library/npcs', baseName),
                  path.resolve(process.cwd(), 'public/images/characters/library/operators', baseName),
                ]
                const found = candidates.find((p) => fs.existsSync(p))
                if (found) absSource = found
                else return sendJson(400, { ok: false, error: `소스 파일 없음: ${cleanSource}` })
              }
              try {
                const { execFileSync } = await import('node:child_process')
                const pyCode = `import sys\nfrom PIL import Image\nsrc, dst = sys.argv[1], sys.argv[2]\nim = Image.open(src).convert('RGBA')\nim.resize((180, 180), Image.Resampling.LANCZOS).save(dst, 'PNG')\nprint('DONE')`
                execFileSync('python', ['-c', pyCode, absSource, targetPath], { encoding: 'utf8' })
              } catch {
                fs.copyFileSync(absSource, targetPath)
              }
            }

            console.log(`[PRTS Admin API] Direct avatar assigned & normalized (180x180): ${targetPath}`)
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
            if (!fileName || !dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
              return sendJson(400, { ok: false, error: '유효하지 않은 PNG 데이터입니다.' })
            }
            const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_')
            const finalName = safeName.endsWith('.png') ? safeName : `${safeName}.png`
            const targetPath = path.resolve(process.cwd(), 'public/images/characters', finalName)
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
            fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'))
            console.log(`[PRTS Admin API] Avatar crop saved: ${targetPath}`)
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
            let absSource = path.resolve(process.cwd(), 'public', cleanSource)
            if (!fs.existsSync(absSource)) {
              const baseName = path.basename(cleanSource)
              const libNpc = path.resolve(process.cwd(), 'public/images/characters/library/npcs', baseName)
              const libNamed = path.resolve(process.cwd(), 'public/images/characters/library/named_characters', baseName)
              const libOp = path.resolve(process.cwd(), 'public/images/characters/library/operators', baseName)
              const libAv = path.resolve(process.cwd(), 'public/images/characters/library/avatars', baseName)
              if (fs.existsSync(libNpc)) absSource = libNpc
              else if (fs.existsSync(libNamed)) absSource = libNamed
              else if (fs.existsSync(libOp)) absSource = libOp
              else if (fs.existsSync(libAv)) absSource = libAv
              else return sendJson(400, { ok: false, error: `소스 파일 없음: ${cleanSource}` })
            }
            const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_')
            const finalName = safeName.endsWith('.png') ? safeName : `${safeName}.png`
            const targetPath = path.resolve(process.cwd(), 'public/images/characters', finalName)

            const { execFileSync } = await import('node:child_process')
            const pyCode = `import sys\nfrom PIL import Image\nsrc, dst, fx, fy, z = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])\nimg = Image.open(src).convert('RGBA')\niw, ih = img.size\ncrop_size = min(iw, ih) / max(0.25, z)\ncx, cy = (fx / 100.0) * iw, (fy / 100.0) * ih\nl, t = cx - crop_size / 2.0, cy - crop_size / 2.0\ncropped = img.crop((int(l), int(t), int(l + crop_size), int(t + crop_size)))\ncropped.resize((180, 180), Image.Resampling.LANCZOS).save(dst, 'PNG')\nprint('DONE')`
            execFileSync('python', ['-c', pyCode, absSource, targetPath, String(focusX), String(focusY), String(zoom)], { encoding: 'utf8' })
            console.log(`[PRTS Admin API] Avatar cropped via PIL: ${targetPath}`)
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
              const changedLines = statusRaw.split('\n').map((l) => l.trim()).filter(Boolean)
              return sendJson(200, {
                ok: true,
                clean: changedLines.length === 0,
                changedCount: changedLines.length,
                branch: branchRaw,
                commit: headRaw,
                files: changedLines.slice(0, 30),
              })
            } catch (gitErr) {
              const errMsg = gitErr instanceof Error ? gitErr.message : String(gitErr)
              return sendJson(500, { ok: false, error: errMsg })
            }
          }

          if (req.url === '/__prts_admin_api/git-commit' && req.method === 'POST') {
            const raw = await readBody()
            const { message } = (raw ? JSON.parse(raw) : {}) as { message?: string }
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

              return sendJson(200, {
                ok: true,
                commitHash: newHead,
                message: commitMsg,
                stdout: commitOut,
              })
            } catch (commitErr) {
              const errMsg = commitErr instanceof Error ? commitErr.message : String(commitErr)
              console.error('[PRTS Admin API] Git commit failed:', errMsg)
              return sendJson(500, { ok: false, error: errMsg })
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
          if (id.includes('src/data/stories/')) {
            return 'data-stories'
          }
        },
      },
    },
  },
})
