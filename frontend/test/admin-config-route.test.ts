import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';

const BACKEND_URL = 'http://backend.test';
const BACKEND_USER_URL = `${BACKEND_URL}/api/users/me`;

type FetchCall = {
  url: string;
  authorization?: string;
  cache?: RequestCache;
};

const originalCwd = process.cwd();
const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

type AdminConfigRoute = typeof import('../src/app/frontend-api/admin/config/route');

async function withRouteWorkspace(testBody: (workspace: string) => Promise<void>) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'admin-config-route-'));
  const frontendRoot = path.join(workspaceRoot, 'frontend');

  await mkdir(frontendRoot, { recursive: true });
  process.chdir(frontendRoot);

  try {
    await testBody(workspaceRoot);
  } finally {
    process.chdir(originalCwd);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

function installFetchStub(calls: FetchCall[]) {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    const authorization = getAuthorization(init?.headers);
    calls.push({ url, authorization, cache: init?.cache });

    if (url !== BACKEND_USER_URL) {
      return new Response('Not found', { status: 404 });
    }

    if (authorization === 'Bearer admin-token') {
      return Response.json({ role: 'admin' });
    }

    if (authorization === 'Bearer user-token') {
      return Response.json({ role: 'user' });
    }

    return new Response('Unauthorized', { status: 401 });
  };
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

function makeRequest(token: string | null, body?: unknown) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return new NextRequest('http://localhost/frontend-api/admin/config', {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function makeCookieOnlyRequest(token: string, body?: unknown) {
  return new NextRequest('http://localhost/frontend-api/admin/config', {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `jwt=${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function configPath(workspaceRoot: string) {
  return path.join(workspaceRoot, 'frontend', 'public', 'config', 'homepage.json');
}

async function responseJson(response: Response) {
  return await response.json() as {
    success?: boolean;
    error?: string;
    config?: Record<string, unknown>;
  };
}

async function rejectsCookieOnlyTokenBeforeBackendOrFileAccess(route: AdminConfigRoute) {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await route.GET(makeCookieOnlyRequest('admin-token'));
    const body = await responseJson(response);

    assert.equal(response.status, 401);
    assert.match(body.error ?? '', /login/i);
    assert.equal(existsSync(configPath(workspaceRoot)), false);
    assert.deepEqual(calls, []);
  });
}

async function rejectsNonAdminBearerBeforeFileAccess(route: AdminConfigRoute) {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await route.POST(makeRequest('user-token', { heroImage: { imageUrl: '/x.jpg' } }));
    const body = await responseJson(response);

    assert.equal(response.status, 403);
    assert.match(body.error ?? '', /Admin access required/i);
    assert.equal(existsSync(configPath(workspaceRoot)), false);
    assert.deepEqual(calls, [{ url: BACKEND_USER_URL, authorization: 'Bearer user-token', cache: 'no-store' }]);
  });
}

async function allowsAdminBearerToWriteConfig(route: AdminConfigRoute) {
  await withRouteWorkspace(async (workspaceRoot) => {
    const calls: FetchCall[] = [];
    installFetchStub(calls);

    const response = await route.POST(makeRequest('admin-token', {
      heroImage: {
        imageUrl: '/images/home/hero.jpg',
        description: 'New hero',
      },
    }));
    const body = await responseJson(response);
    const saved = JSON.parse(await readFile(configPath(workspaceRoot), 'utf-8'));

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(saved.heroImage.description, 'New hero');
    assert.equal(typeof saved.lastUpdated, 'string');
    assert.deepEqual(calls, [{ url: BACKEND_USER_URL, authorization: 'Bearer admin-token', cache: 'no-store' }]);
  });
}

async function main() {
  process.env.NEXT_PUBLIC_API_URL = BACKEND_URL;
  const route = await import('../src/app/frontend-api/admin/config/route');

  try {
    await rejectsCookieOnlyTokenBeforeBackendOrFileAccess(route);
    await rejectsNonAdminBearerBeforeFileAccess(route);
    await allowsAdminBearerToWriteConfig(route);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv('NEXT_PUBLIC_API_URL', originalApiUrl);
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
