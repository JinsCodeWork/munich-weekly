const MAX_REPORT_PREVIEW_LENGTH = 500;

function previewBody(body: string) {
  return body.slice(0, MAX_REPORT_PREVIEW_LENGTH);
}

export async function POST(request: Request) {
  const body = await request.text();
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    console.warn('CSP report received', '');
    return new Response(null, { status: 204 });
  }

  try {
    console.warn('CSP report received', JSON.parse(trimmedBody));
  } catch {
    console.warn('CSP report received', previewBody(body));
  }

  return new Response(null, { status: 204 });
}
