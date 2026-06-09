import assert from 'node:assert/strict';

import { POST } from '../src/app/frontend-api/csp-report/route';

type WarnCall = unknown[];

const originalWarn = console.warn;
const HUGE_BLOCKED_URI = `https://evil.example/${'x'.repeat(1000)}`;
const HUGE_REPORT_BODY = JSON.stringify({
  'csp-report': {
    'document-uri': 'https://munichweekly.art/',
    'violated-directive': 'img-src',
    'blocked-uri': `https://evil.example/${'y'.repeat(20 * 1024)}`,
  },
});

function makeRequest(body: string, headers?: HeadersInit) {
  return new Request('http://localhost/frontend-api/csp-report', {
    method: 'POST',
    headers: {
      'content-type': 'application/csp-report',
      ...headers,
    },
    body,
  });
}

function makeStreamingRequest(body: string) {
  const encoded = new TextEncoder().encode(body);

  return new Request('http://localhost/frontend-api/csp-report', {
    method: 'POST',
    headers: {
      'content-type': 'application/csp-report',
    },
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded);
        controller.close();
      },
    }),
    duplex: 'half',
  } as RequestInit);
}

async function withWarnStub(testBody: (calls: WarnCall[]) => Promise<void>) {
  const calls: WarnCall[] = [];
  console.warn = (...args: unknown[]) => {
    calls.push(args);
  };

  try {
    await testBody(calls);
  } finally {
    console.warn = originalWarn;
  }
}

async function acceptsJsonReportsAndLogsOnce() {
  await withWarnStub(async (calls) => {
    const response = await POST(makeRequest(JSON.stringify({
      'csp-report': {
        'document-uri': 'https://munichweekly.art/',
        'violated-directive': 'script-src',
      },
    })));

    assert.equal(response.status, 204);
    assert.equal(calls.length, 1);
    assert.match(String(calls[0][0]), /CSP report/i);
    assert.deepEqual(calls[0][1], {
      documentUri: 'https://munichweekly.art/',
      violatedDirective: 'script-src',
      blockedUri: undefined,
      sourceFile: undefined,
      lineNumber: undefined,
      disposition: undefined,
    });
  });
}

async function acceptsMalformedJsonWithoutThrowing() {
  await withWarnStub(async (calls) => {
    const response = await POST(makeRequest('{not json'));

    assert.equal(response.status, 204);
    assert.equal(calls.length, 1);
    assert.match(String(calls[0][0]), /CSP report/i);
    assert.equal(typeof calls[0][1], 'string');
    assert.match(String(calls[0][1]), /\{not json/);
  });
}

async function boundsValidJsonReportLogging() {
  await withWarnStub(async (calls) => {
    const response = await POST(makeRequest(JSON.stringify({
      'csp-report': {
        'document-uri': 'https://munichweekly.art/',
        'violated-directive': 'img-src',
        'blocked-uri': HUGE_BLOCKED_URI,
      },
    })));

    assert.equal(response.status, 204);
    assert.equal(calls.length, 1);
    assert.match(String(calls[0][0]), /CSP report/i);
    assert.equal(typeof calls[0][1], 'object');
    assert.notEqual(calls[0][1], null);

    const loggedPayload = calls[0][1] as { blockedUri?: string };
    assert.ok(loggedPayload.blockedUri);
    assert.ok(loggedPayload.blockedUri.length < HUGE_BLOCKED_URI.length);
    assert.equal(loggedPayload.blockedUri.includes('x'.repeat(1000)), false);
  });
}

async function skipsOversizedContentLengthWithoutParsingBody() {
  await withWarnStub(async (calls) => {
    const response = await POST(makeRequest(HUGE_REPORT_BODY, {
      'content-length': String(HUGE_REPORT_BODY.length),
    }));

    assert.equal(response.status, 204);
    assert.equal(calls.length, 1);
    assert.match(String(calls[0][0]), /CSP report/i);
    assert.deepEqual(calls[0][1], {
      oversized: true,
      contentLength: HUGE_REPORT_BODY.length,
      maxBytes: 16 * 1024,
    });
  });
}

async function stopsReadingOversizedStreamWithoutParsingTruncatedBody() {
  await withWarnStub(async (calls) => {
    const response = await POST(makeStreamingRequest(HUGE_REPORT_BODY));

    assert.equal(response.status, 204);
    assert.equal(calls.length, 1);
    assert.match(String(calls[0][0]), /CSP report/i);
    assert.equal(typeof calls[0][1], 'object');
    assert.notEqual(calls[0][1], null);

    const loggedPayload = calls[0][1] as { oversized?: boolean; truncated?: boolean; bodyPreview?: string };
    assert.equal(loggedPayload.oversized, true);
    assert.equal(loggedPayload.truncated, true);
    assert.ok(loggedPayload.bodyPreview);
    assert.ok(loggedPayload.bodyPreview.length <= 500);
    assert.equal(loggedPayload.bodyPreview.includes('y'.repeat(1000)), false);
  });
}

async function main() {
  await acceptsJsonReportsAndLogsOnce();
  await acceptsMalformedJsonWithoutThrowing();
  await boundsValidJsonReportLogging();
  await skipsOversizedContentLengthWithoutParsingBody();
  await stopsReadingOversizedStreamWithoutParsingTruncatedBody();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
