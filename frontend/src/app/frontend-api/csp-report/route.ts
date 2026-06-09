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

export async function POST(request: Request) {
  const body = await request.text();
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
