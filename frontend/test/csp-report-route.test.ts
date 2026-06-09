import assert from 'node:assert/strict';

import { POST } from '../src/app/frontend-api/csp-report/route';

type WarnCall = unknown[];

const originalWarn = console.warn;
const HUGE_BLOCKED_URI = `https://evil.example/${'x'.repeat(1000)}`;

function makeRequest(body: string) {
  return new Request('http://localhost/frontend-api/csp-report', {
    method: 'POST',
    headers: {
      'content-type': 'application/csp-report',
    },
    body,
  });
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

async function main() {
  await acceptsJsonReportsAndLogsOnce();
  await acceptsMalformedJsonWithoutThrowing();
  await boundsValidJsonReportLogging();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
