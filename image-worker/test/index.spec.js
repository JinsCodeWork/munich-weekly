import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src';

const BASE_ENV = {
	PHOTO_BUCKET: {
		get: vi.fn(async () => null),
		list: vi.fn(async () => ({ objects: [] })),
	},
};

async function fetchWorker(path, env = BASE_ENV, init = {}) {
	const request = new Request(`https://img.example.test${path}`, init);
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

describe('image worker routing', () => {
	it('/health remains public', async () => {
		const response = await fetchWorker('/health');
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.status).toBe('ok');
	});

	it('returns 404 for debug endpoints by default', async () => {
		for (const path of ['/debug-params', '/debug-auth', '/debug-request']) {
			const response = await fetchWorker(path);
			expect(response.status).toBe(404);
		}
	});

	it('requires a valid debug secret when debug routes are enabled', async () => {
		const env = {
			...BASE_ENV,
			DEBUG_ROUTES_ENABLED: 'true',
			DEBUG_AUTH_SECRET: 'abcdefghijklmnopqrstuvwxyz123456',
		};

		const missingSecretResponse = await fetchWorker('/debug-params?width=100', env);
		expect(missingSecretResponse.status).toBe(403);

		const validSecretResponse = await fetchWorker('/debug-params?width=100', env, {
			headers: {
				'x-debug-secret': env.DEBUG_AUTH_SECRET,
				'user-agent': 'vitest',
			},
		});
		const body = await validSecretResponse.json();

		expect(validSecretResponse.status).toBe(200);
		expect(body.processedParams.width).toBe('100');
		expect(body.requestHeaders).toBeUndefined();
		expect(body.userAgent).toBeUndefined();
		expect(body.url).toBeUndefined();
	});

	it('does not list R2 object keys from debug auth', async () => {
		const env = {
			PHOTO_BUCKET: {
				get: vi.fn(async () => null),
				list: vi.fn(async () => ({
					objects: [{ key: 'uploads/private/object.jpg' }],
				})),
			},
			DEBUG_ROUTES_ENABLED: 'true',
			DEBUG_AUTH_SECRET: 'abcdefghijklmnopqrstuvwxyz123456',
		};

		const response = await fetchWorker('/debug-auth', env, {
			headers: { 'x-debug-secret': env.DEBUG_AUTH_SECRET },
		});
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.bucketBindingPresent).toBe(true);
		expect(body.testObjectAccessible).toBe(false);
		expect(JSON.stringify(body)).not.toContain('uploads/private/object.jpg');
		expect(env.PHOTO_BUCKET.list).not.toHaveBeenCalled();
	});

	it('continues to route uploads through the image handler', async () => {
		const env = {
			PHOTO_BUCKET: {
				get: vi.fn(async () => null),
				list: vi.fn(async () => ({ objects: [] })),
			},
		};

		const response = await fetchWorker('/uploads/issues/1/submissions/missing.jpg', env);

		expect(response.status).toBe(404);
		expect(env.PHOTO_BUCKET.get).toHaveBeenCalledWith('uploads/issues/1/submissions/missing.jpg');
	});
});
