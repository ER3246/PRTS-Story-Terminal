/**
 * PRTS Story Terminal - 공식 리소스 정규화 임포트 도구 (Asset Importer & Normalizer)
 * 
 * [목적 및 원칙]
 * 1. 로컬에만 존재하는 대용량 원본 라이브러리(public/images/characters/library)에서
 *    스토리에 실제로 확정된 캐릭터의 리소스만 '복사 및 정규화'하여 프로젝트에 안전하게 배치합니다.
 * 2. 원시 데이터마이닝 파일명(avg_npc_*, char_*)을 공개 저장소 규격에 맞는 직관적인 고유명(alina.png, blake.png 등)으로 자동 변환합니다.
 * 3. 1:1 아바타(180x180)와 전신 일러스트를 자동 동기화하고 characterCgAssets.ts에 등록합니다.
 * 
 * [사용법]
 *   node scripts/import_character_asset.cjs <assetId> <librarySubPathOrFileName>
 * 
 * [예시]
 *   node scripts/import_character_asset.cjs blake npcs/avg_npc_899_1$1.png
 *   node scripts/import_character_asset.cjs talulah npcs/avg_npc_043_1.png
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const LIB_DIR = path.resolve(ROOT_DIR, 'public/images/characters/library');
const ILLUST_DIR = path.resolve(ROOT_DIR, 'public/images/characters/illust');
const AVATAR_DIR = path.resolve(ROOT_DIR, 'public/images/characters');
const CG_ASSETS_PATH = path.resolve(ROOT_DIR, 'src/data/db/characterCgAssets.ts');

function printUsage() {
  console.log(`
[PRTS Asset Importer]
사용법: node scripts/import_character_asset.cjs <assetId_or_charName> <library_relative_path_or_file>

예시:
  node scripts/import_character_asset.cjs ace named_characters/char_014_riope.png
  node scripts/import_character_asset.cjs talulah npcs/avg_npc_043_1.png
  node scripts/import_character_asset.cjs saria operators/char_202_demkni_1.png
`);
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    printUsage();
    process.exit(1);
  }

  const rawCharId = args[0].toLowerCase().trim().replace(/^cg_/, '');
  const libTarget = args[1].trim();

  // 1. Resolve source file from library
  let sourcePath = path.resolve(LIB_DIR, libTarget);
  if (!fs.existsSync(sourcePath)) {
    // Try searching inside subdirectories (npcs, operators, named_characters, avatars)
    const subs = ['npcs', 'operators', 'named_characters', 'avatars'];
    let found = false;
    for (const sub of subs) {
      const candidate = path.resolve(LIB_DIR, sub, path.basename(libTarget));
      if (fs.existsSync(candidate)) {
        sourcePath = candidate;
        found = true;
        break;
      }
    }
    if (!found) {
      console.error(`❌ [오류] 원본 라이브러리에서 파일을 찾을 수 없습니다: ${libTarget}`);
      console.error(`   검색 경로: ${LIB_DIR}`);
      process.exit(1);
    }
  }

  // 2. Standardize target canonical filename (e.g. ace.png, talulah.png)
  const canonicalName = `${rawCharId}.png`;
  const targetIllustPath = path.resolve(ILLUST_DIR, canonicalName);

  if (!fs.existsSync(ILLUST_DIR)) {
    fs.mkdirSync(ILLUST_DIR, { recursive: true });
  }

  // 3. Copy from raw library to project illust directory
  fs.copyFileSync(sourcePath, targetIllustPath);
  console.log(`✅ [복사 완료] ${path.relative(ROOT_DIR, sourcePath)} -> ${path.relative(ROOT_DIR, targetIllustPath)}`);

  // 4. Update characterCgAssets.ts if record exists
  if (fs.existsSync(CG_ASSETS_PATH)) {
    let cgCode = fs.readFileSync(CG_ASSETS_PATH, 'utf8');
    const aid = `cg_${rawCharId}`;

    if (cgCode.includes(`assetId: "${aid}"`)) {
      const regex = new RegExp(
        `(assetId:\\s*"${aid}".*?illustFileName:\\s*")[^"]*(".*?illustUrl:\\s*")[^"]*(")`,
        's'
      );
      if (regex.test(cgCode)) {
        cgCode = cgCode.replace(regex, `$1${canonicalName}$2/images/characters/illust/${canonicalName}$3`);
        fs.writeFileSync(CG_ASSETS_PATH, cgCode, 'utf8');
        console.log(`✅ [DB 갱신] characterCgAssets.ts [${aid}] illustUrl을 '/images/characters/illust/${canonicalName}'으로 정규화했습니다.`);
      }
    }
  }

  console.log(`
🎉 [정규화 임포트 성공]
- 표준 전신 경로: /images/characters/illust/${canonicalName}
- 스튜디오(http://localhost:5173/#/studio)에서 '${rawCharId}'의 얼굴 뷰포트 크롭을 확인 및 저장하세요.
`);
}

run().catch((err) => {
  console.error('❌ 임포트 실패:', err);
  process.exit(1);
});
