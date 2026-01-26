export const withBase = (base: string, path: string) => `${base}${path.replace(/^\/+/, '')}`;
