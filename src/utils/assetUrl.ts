/**
 * GitHub Pages 서브패스 배포 환경(예: /PRTS-Story-Terminal/ 또는 상대 경로 ./)에서
 * '/images/...' 형태의 정적 에셋 경로가 404로 깨지지 않도록 import.meta.env.BASE_URL을 결합합니다.
 */
export function resolveAssetUrl(path?: string | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (
    !trimmed ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const base = import.meta.env.BASE_URL || './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = trimmed.replace(/^(\.\/|\/)+/, '');

  // 이미 BASE_URL이 접두사로 붙어있는 경우 중복 결합 방지
  if (normalizedBase !== './' && normalizedBase !== '/' && trimmed.startsWith(normalizedBase)) {
    return trimmed;
  }

  return `${normalizedBase}${cleanPath}`;
}
