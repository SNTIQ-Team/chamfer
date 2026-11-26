export const SITE_URL = 'https://sntiq.com';

export const TAPER_API_BASE_URL =
  process.env.NEXT_PUBLIC_TAPER_API_BASE_URL ?? 'https://api.sntiq.com/taper';
export const CHAMFER_API_BASE_URL =
  process.env.NEXT_PUBLIC_CHAMFER_API_BASE_URL ?? 'https://api.sntiq.com/chamfer';

const serviceUrl = (base: string, path: string) =>
  `${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

export const taperUrl = (path: string) => serviceUrl(TAPER_API_BASE_URL, path);
export const chamferUrl = (path: string) => serviceUrl(CHAMFER_API_BASE_URL, path);
