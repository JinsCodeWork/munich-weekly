import assert from 'node:assert/strict';

import { POST } from '../src/app/frontend-api/csp-report/route';

type WarnCall = unknown[];

const originalWarn = console.warn;

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
      'csp-report': {
        'document-uri': 'https://munichweekly.art/',
        'violated-directive': 'script-src',
      },
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

async function main() {
  await acceptsJsonReportsAndLogsOnce();
  await acceptsMalformedJsonWithoutThrowing();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
