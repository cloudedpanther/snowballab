export const withBase = (base: string, path: string) => `${base}${path.replace(/^\/+/, '')}`;

/** path 또는 이미 절대 URL을 받아 항상 https:// 도메인 절대 URL로 반환 */
export const toAbsoluteUrl = (pathOrUrl: string, site: string): string => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return new URL(pathOrUrl, site).href;
};
