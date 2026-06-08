import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import path from 'path';

const MAX_HERO_IMAGE_BYTES = 30 * 1024 * 1024;
const ALLOWED_REMOTE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png']);
const DEFAULT_ALLOWED_REMOTE_ORIGINS = [
  'https://img.munichweekly.art',
  'https://pub-42cc142968d044e0b7182fa9177333cf.r2.dev',
];
const LOCAL_HERO_FILES = new Map([
  ['/uploads/hero.jpg', 'hero.jpg'],
  ['/uploads/hero.jpeg', 'hero.jpeg'],
  ['/uploads/hero.png', 'hero.png'],
]);

type HeroSource =
  | { type: 'backend-file'; fileName: string }
  | { type: 'remote'; url: URL };

class HeroSyncError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'HeroSyncError';
  }
}

function getApiBaseUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function getAuthToken(request: NextRequest): string | null {
  const authCookie = request.cookies.get('jwt')?.value;
  if (authCookie) {
    return authCookie;
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

async function verifyAdminRole(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const user = await response.json();
    return user.role === 'admin';
  } catch {
    return false;
  }
}

function getAllowedRemoteOrigins(): Set<string> {
  const configuredOrigins = (process.env.HERO_IMAGE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...DEFAULT_ALLOWED_REMOTE_ORIGINS, ...configuredOrigins]);
}

function getRequestedImageUrl(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  return (body as { imageUrl?: unknown }).imageUrl;
}

function resolveHeroSource(imageUrl: unknown): HeroSource {
  if (imageUrl === undefined || imageUrl === null || imageUrl === '') {
    return { type: 'backend-file', fileName: 'hero.jpg' };
  }

  if (typeof imageUrl !== 'string') {
    throw new HeroSyncError('Invalid imageUrl', 400);
  }

  const trimmedImageUrl = imageUrl.trim();
  if (!trimmedImageUrl) {
    return { type: 'backend-file', fileName: 'hero.jpg' };
  }

  const localFileName = LOCAL_HERO_FILES.get(trimmedImageUrl);
  if (localFileName) {
    return { type: 'backend-file', fileName: localFileName };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedImageUrl);
  } catch {
    throw new HeroSyncError('Remote hero image URL is invalid', 400);
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new HeroSyncError('Remote hero image URL is not allowed; HTTPS is required', 400);
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new HeroSyncError('Remote hero image URL credentials are not allowed', 400);
  }

  if (isPrivateOrLocalHostname(parsedUrl.hostname)) {
    throw new HeroSyncError('Remote hero image URL points to a private or local host', 400);
  }

  if (!getAllowedRemoteOrigins().has(parsedUrl.origin)) {
    throw new HeroSyncError('Remote hero image origin is not allowed', 400);
  }

  return { type: 'remote', url: parsedUrl };
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalizedHost === 'localhost' || normalizedHost.endsWith('.localhost')) {
    return true;
  }

  const mappedIpv4Octets = getIpv4MappedIpv6Octets(normalizedHost);
  if (mappedIpv4Octets) {
    return isPrivateIpv4Octets(mappedIpv4Octets);
  }

  if (isPrivateIpv6Literal(normalizedHost)) {
    return true;
  }

  const ipv4Match = normalizedHost.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) {
    return false;
  }

  const octets = ipv4Match.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return true;
  }

  return isPrivateIpv4Octets(octets);
}

function getIpv4MappedIpv6Octets(hostname: string): number[] | null {
  const mappedIpv6Match = hostname.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!mappedIpv6Match) {
    return null;
  }

  const highBits = Number.parseInt(mappedIpv6Match[1], 16);
  const lowBits = Number.parseInt(mappedIpv6Match[2], 16);
  return [
    (highBits >> 8) & 255,
    highBits & 255,
    (lowBits >> 8) & 255,
    lowBits & 255,
  ];
}

function isPrivateIpv4Octets(octets: number[]): boolean {
  const [first, second] = octets;
  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6Literal(hostname: string): boolean {
  if (!hostname.includes(':')) {
    return false;
  }

  return (
    hostname === '::' ||
    hostname === '::1' ||
    hostname.startsWith('fc') ||
    hostname.startsWith('fd') ||
    hostname.startsWith('fe8') ||
    hostname.startsWith('fe9') ||
    hostname.startsWith('fea') ||
    hostname.startsWith('feb')
  );
}

async function readBackendHeroFile(fileName: string): Promise<Buffer> {
  const backendHeroPath = path.join(process.cwd(), '..', 'backend', 'uploads', fileName);

  try {
    const fileStats = await stat(backendHeroPath);
    if (fileStats.size > MAX_HERO_IMAGE_BYTES) {
      throw new HeroSyncError('Hero image file exceeds the limit of 30MB', 413);
    }

    const buffer = await readFile(backendHeroPath);
    validateImageSignature(buffer);
    return buffer;
  } catch (error) {
    if (error instanceof HeroSyncError) {
      throw error;
    }

    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new HeroSyncError('Hero image not found in backend uploads directory. Please upload a hero image first.', 404);
    }

    throw error;
  }
}

async function downloadRemoteHero(url: URL): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      redirect: 'error',
    });
  } catch (error) {
    throw new HeroSyncError(
      `Failed to download hero image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      502,
    );
  }

  if (!response.ok) {
    throw new HeroSyncError(`Failed to download hero image: ${response.status} ${response.statusText}`, 502);
  }

  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (!contentType || !ALLOWED_REMOTE_CONTENT_TYPES.has(contentType)) {
    throw new HeroSyncError('Remote hero image must be a JPEG or PNG image', 400);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (Number.isFinite(parsedLength) && parsedLength > MAX_HERO_IMAGE_BYTES) {
      throw new HeroSyncError('Remote hero image exceeds the limit of 30MB', 413);
    }
  }

  const buffer = await readResponseBodyWithLimit(response);
  validateImageSignature(buffer);
  return buffer;
}

async function readResponseBodyWithLimit(response: Response): Promise<Buffer> {
  if (!response.body) {
    throw new HeroSyncError('Remote hero image response has no body', 502);
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_HERO_IMAGE_BYTES) {
      throw new HeroSyncError('Remote hero image exceeds the limit of 30MB', 413);
    }

    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks, totalBytes);
}

function validateImageSignature(buffer: Buffer): void {
  if (isJpeg(buffer) || isPng(buffer)) {
    return;
  }

  throw new HeroSyncError('Hero image content is not a valid JPEG or PNG image', 400);
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer: Buffer): boolean {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return buffer.length >= pngSignature.length && pngSignature.every((byte, index) => buffer[index] === byte);
}

async function writeFrontendHero(buffer: Buffer): Promise<void> {
  const frontendHeroPath = path.join(process.cwd(), 'public', 'images', 'home', 'hero.jpg');
  await mkdir(path.dirname(frontendHeroPath), { recursive: true });
  await writeFile(frontendHeroPath, buffer);
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }

    const isAdmin = await verifyAdminRole(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = undefined;
    }

    const source = resolveHeroSource(getRequestedImageUrl(body));
    const sourceImageData =
      source.type === 'remote'
        ? await downloadRemoteHero(source.url)
        : await readBackendHeroFile(source.fileName);

    await writeFrontendHero(sourceImageData);

    return NextResponse.json({
      success: true,
      message: 'Hero image synced successfully to frontend',
      localPath: '/images/home/hero.jpg',
      sourceType: source.type === 'remote' ? 'remote' : 'backend-file',
    });
  } catch (error) {
    if (error instanceof HeroSyncError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}
