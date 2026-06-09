const MAX_REPORT_BODY_BYTES = 16 * 1024;
const MAX_REPORT_PREVIEW_LENGTH = 500;
const MAX_REPORT_FIELD_LENGTH = 200;

function previewBody(body: string) {
  return body.slice(0, MAX_REPORT_PREVIEW_LENGTH);
}

function previewField(value: unknown) {
  if (typeof value !== 'string') {
    return typeof value === 'number' || typeof value === 'boolean' ? value : undefined;
  }

  return value.slice(0, MAX_REPORT_FIELD_LENGTH);
}

function getReportPayload(parsedBody: unknown) {
  if (!parsedBody || typeof parsedBody !== 'object') {
    return {};
  }

  const bodyRecord = parsedBody as Record<string, unknown>;
  const cspReport = bodyRecord['csp-report'];
  if (cspReport && typeof cspReport === 'object') {
    return cspReport as Record<string, unknown>;
  }

  return bodyRecord;
}

function summarizeReport(parsedBody: unknown) {
  const report = getReportPayload(parsedBody);

  return {
    documentUri: previewField(report['document-uri']),
    violatedDirective: previewField(report['violated-directive']),
    blockedUri: previewField(report['blocked-uri']),
    sourceFile: previewField(report['source-file']),
    lineNumber: previewField(report['line-number']),
    disposition: previewField(report.disposition),
  };
}

function parseContentLength(request: Request) {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) {
    return null;
  }

  const parsedLength = Number(contentLength);
  return Number.isFinite(parsedLength) && parsedLength >= 0 ? parsedLength : null;
}

async function readBoundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) {
    return { body: '', oversized: false };
  }

  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    bytesRead += value.byteLength;
    if (bytesRead > MAX_REPORT_BODY_BYTES) {
      const remainingBytes = Math.max(MAX_REPORT_BODY_BYTES - (bytesRead - value.byteLength), 0);
      if (remainingBytes > 0) {
        chunks.push(value.slice(0, remainingBytes));
      }

      await reader.cancel();
      return {
        body: new TextDecoder().decode(concatChunks(chunks)),
        oversized: true,
      };
    }

    chunks.push(value);
  }

  return {
    body: new TextDecoder().decode(concatChunks(chunks)),
    oversized: false,
  };
}

function concatChunks(chunks: Uint8Array[]) {
  const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result;
}

export async function POST(request: Request) {
  const contentLength = parseContentLength(request);
  if (contentLength !== null && contentLength > MAX_REPORT_BODY_BYTES) {
    console.warn('CSP report received', {
      oversized: true,
      contentLength,
      maxBytes: MAX_REPORT_BODY_BYTES,
    });

    return new Response(null, { status: 204 });
  }

  const { body, oversized } = await readBoundedBody(request);
  if (oversized) {
    console.warn('CSP report received', {
      oversized: true,
      truncated: true,
      maxBytes: MAX_REPORT_BODY_BYTES,
      bodyPreview: previewBody(body),
    });

    return new Response(null, { status: 204 });
  }

  const trimmedBody = body.trim();

  if (!trimmedBody) {
    console.warn('CSP report received', '');
    return new Response(null, { status: 204 });
  }

  try {
    console.warn('CSP report received', summarizeReport(JSON.parse(trimmedBody)));
  } catch {
    console.warn('CSP report received', previewBody(body));
  }

  return new Response(null, { status: 204 });
}
