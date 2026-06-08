import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';

import { POST } from '../src/app/frontend-api/admin/sync-hero/route';

const BACKEND_URL = 'http://backend.test';
const HERO_URL = 'https://img.munichweekly.art/uploads/hero.jpg';
const PRIVATE_URL = 'http://169.254.169.254/latest/meta-data';
const PRIVATE_IPV6_URL = 'https://[::1]/hero.jpg';
const PRIVATE_MAPPED_IPV6_URL = 'https://[::ffff:127.0.0.1]/hero.jpg';
const NORMALIZED_PRIVATE_MAPPED_IPV6_URL = 'https://[::ffff:7f00:1]/hero.jpg';
const CREDENTIALS_URL = 'https://user:pass@img.munichweekly.art/uploads/hero.jpg';
const TEXT_URL = 'https://img.munichweekly.art/uploads/not-an-image.txt';
const OVERSIZED_URL = 'https://img.munichweekly.art/uploads/oversized.jpg';
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9]);
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x00,
]);
const MAX_HERO_IMAGE_BYTES = 30 * 1024 * 1024;

type FetchCall = {
  url: string;
  authorization?: string;
  redirect?: RequestRedirect;
  cache?: RequestCache;
};

const originalCwd = process.cwd();
const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
const originalAllowedOrigins = process.env.HERO_IMAGE_ALLOWED_ORIGINS;

async function withRouteWorkspace(testBody: (workspace: string) => Promise<void>) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'sync-hero-route-'));
  const frontendRoot = path.join(workspaceRoot, 'frontend');
  const backendUploadsRoot = path.join(workspaceRoot, 'backend', 'uploads');

  await mkdir(frontendRoot, { recursive: true });
  await mkdir(backendUploadsRoot, { recursive: true });

  process.chdir(frontendRoot);

  try {
    await testBody(workspaceRoot);
  } finally {
    process.chdir(originalCwd);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

function getAuthorization(headers: HeadersInit | undefined): string | undefined {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return headers.get('Authorization') ?? headers.get('authorization') ?? undefined;
  }

  if (Array.isArray(headers)) {
    return headers.find(([key]) => key.toLowerCase() === 'authorization')?.[1];
  }

  return headers.Authorization ?? headers.authorization;
}

function installFetchStub(calls: FetchCall[]) {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    const authorization = getAuthorization(init?.headers);
    calls.push({ url, authorization, redirect: init?.redirect, cache: init?.cache });

    if (url === `${BACKEND_URL}/api/users/me`) {
      if (authorization === 'Bearer admin-token') {
        return Response.json({ role: 'admin' });
      }

      if (authorization === 'Bearer user-token') {
        return Response.json({ role: 'user' });
      }

      return new Response('Unauthorized', { status: 401 });
    }

    if (url === HERO_URL) {
      return new Response(JPEG_BYTES, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(JPEG_BYTES.length),
        },
      });
    }

    if (url === TEXT_URL) {
      return new Response('not an image', {
        status: 200,
        headers: {
          'content-type': 'text/plain',
          'content-length': '12',
        },
      });
    }

    if (url === OVERSIZED_URL) {
      return new Response(JPEG_BYTES, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(MAX_HERO_IMAGE_BYTES + 1),
        },
      });
    }

    if (url === PRIVATE_URL) {
      return new Response(JPEG_BYTES, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(JPEG_BYTES.length),
        },
      });
    }

    if (url === PRIVATE_IPV6_URL) {
      return new Response(JPEG_BYTES, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(JPEG_BYTES.length),
        },
      });
    }

    if (url === NORMALIZED_PRIVATE_MAPPED_IPV6_URL) {
      return new Response(JPEG_BYTES, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(JPEG_BYTES.length),
        },
      });
    }

    return new Response('Not found', { status: 404 });
  };
}

function makeRequest(token: string | null, imageUrl?: string) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return new NextRequest('http://localhost/frontend-api/admin/sync-hero', {
    method: 'POST',
    headers,
    body: JSON.stringify(imageUrl ? { imageUrl } : {}),
  });
}

function frontendHeroPath(workspaceRoot: string) {
  return path.join(workspaceRoot, 'frontend', 'public', 'images', 'home', 'hero.jpg');
}

async function responseJson(response: Response) {
  return await response.json() as { success?: boolean; error?: string; sourceType?: string };
}

async function rejectsMissingTokenBeforeBackendOrImageFetch() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest(null, HERO_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 401);
    assert.match(body.error ?? '', /login/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls, []);
  });
}

async function rejectsArbitraryBearerBeforeMutatingHero() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('not-a-real-token', HERO_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 403);
    assert.match(body.error ?? '', /Admin access required/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`]);
  });
}

async function rejectsNonAdminUserBeforeFetchingImage() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('user-token', HERO_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 403);
    assert.match(body.error ?? '', /Admin access required/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`]);
  });
}

async function rejectsPrivateRemoteUrlBeforeFetchingIt() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('admin-token', PRIVATE_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 400);
    assert.match(body.error ?? '', /not allowed|private/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`]);
  });
}

async function rejectsAllowlistedIpv6LoopbackBeforeFetchingIt() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('admin-token', PRIVATE_IPV6_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 400);
    assert.match(body.error ?? '', /private|local/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`]);
  });
}

async function rejectsAllowlistedIpv4MappedIpv6BeforeFetchingIt() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('admin-token', PRIVATE_MAPPED_IPV6_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 400);
    assert.match(body.error ?? '', /private|local/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`]);
  });
}

async function rejectsRemoteUrlCredentialsBeforeFetchingIt() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('admin-token', CREDENTIALS_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 400);
    assert.match(body.error ?? '', /credentials/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`]);
  });
}

async function rejectsRemoteNonImageContentType() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('admin-token', TEXT_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 400);
    assert.match(body.error ?? '', /JPEG or PNG/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`, TEXT_URL]);
  });
}

async function rejectsOversizedRemoteContentLength() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('admin-token', OVERSIZED_URL));
    const body = await responseJson(response);

    assert.equal(response.status, 413);
    assert.match(body.error ?? '', /30MB/i);
    assert.equal(existsSync(frontendHeroPath(workspaceRoot)), false);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`, OVERSIZED_URL]);
  });
}

async function allowsAdminToSyncTrustedRemoteHero() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await POST(makeRequest('admin-token', HERO_URL));
    const body = await responseJson(response);
    const saved = await readFile(frontendHeroPath(workspaceRoot));

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.sourceType, 'remote');
    assert.deepEqual(saved, JPEG_BYTES);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`, HERO_URL]);
    assert.equal(calls[1].redirect, 'error');
    assert.equal(calls[1].cache, 'no-store');
  });
}

async function allowsAdminToSyncLocalUploadedHeroByExtension() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);
    await writeFile(path.join(workspaceRoot, 'backend', 'uploads', 'hero.png'), PNG_BYTES);

    const response = await POST(makeRequest('admin-token', '/uploads/hero.png'));
    const body = await responseJson(response);
    const saved = await readFile(frontendHeroPath(workspaceRoot));

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.sourceType, 'backend-file');
    assert.deepEqual(saved, PNG_BYTES);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`]);
  });
}

async function allowsAdminToSyncDefaultLocalHeroWhenBodyHasNoImageUrl() {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);
    await writeFile(path.join(workspaceRoot, 'backend', 'uploads', 'hero.jpg'), JPEG_BYTES);

    const response = await POST(makeRequest('admin-token'));
    const body = await responseJson(response);
    const saved = await readFile(frontendHeroPath(workspaceRoot));

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.sourceType, 'backend-file');
    assert.deepEqual(saved, JPEG_BYTES);
    assert.deepEqual(calls.map((call) => call.url), [`${BACKEND_URL}/api/users/me`]);
  });
}

async function main() {
  process.env.NEXT_PUBLIC_API_URL = BACKEND_URL;
  process.env.HERO_IMAGE_ALLOWED_ORIGINS = 'https://img.munichweekly.art,https://[::1],https://[::ffff:7f00:1]';

  try {
    await rejectsMissingTokenBeforeBackendOrImageFetch();
    await rejectsArbitraryBearerBeforeMutatingHero();
    await rejectsNonAdminUserBeforeFetchingImage();
    await rejectsPrivateRemoteUrlBeforeFetchingIt();
    await rejectsAllowlistedIpv6LoopbackBeforeFetchingIt();
    await rejectsAllowlistedIpv4MappedIpv6BeforeFetchingIt();
    await rejectsRemoteUrlCredentialsBeforeFetchingIt();
    await rejectsRemoteNonImageContentType();
    await rejectsOversizedRemoteContentLength();
    await allowsAdminToSyncTrustedRemoteHero();
    await allowsAdminToSyncLocalUploadedHeroByExtension();
    await allowsAdminToSyncDefaultLocalHeroWhenBodyHasNoImageUrl();
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv('NEXT_PUBLIC_API_URL', originalApiUrl);
    restoreEnv('HERO_IMAGE_ALLOWED_ORIGINS', originalAllowedOrigins);
    process.chdir(originalCwd);
  }
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
