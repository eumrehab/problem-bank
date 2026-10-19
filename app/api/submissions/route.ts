// The server reads the Apps Script JSON acknowledgement. An opaque browser
// no-cors response is never evidence that a row was written.
export async function POST(request: Request) {
  let body: string;
  let data: { setId?: string };
  try {
    body = await request.text();
    if (body.length > 150000) return Response.json({ ok: false }, { status: 413 });
    data = JSON.parse(body);
    if (!data || typeof data !== 'object') throw new Error('invalid body');
  } catch { return Response.json({ ok: false, message: '제출 데이터 형식이 올바르지 않습니다.' }, { status: 400 }); }
  // Keep existing rounds connected to their previous endpoint. The new special
  // round explicitly requires an approved server configuration.
  const legacyEndpoint = 'https://script.google.com/macros/s/AKfycbwyr8KcVlvSz4nALEXj2vrN-UUlo_uVLPMsBc99jk4ck6xIeVfXgEINFz1hFbMpaQbj/exec';
  const endpoint = process.env.GOOGLE_SCRIPT_URL || (data.setId === 'health-indicators-ch15-v1'
    ? undefined : process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || legacyEndpoint);
  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)) {
    return Response.json({ ok: false, message: 'Google 저장 연결 승인이 아직 완료되지 않았습니다.' }, { status: 503 });
  }
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body, redirect: 'follow', signal: AbortSignal.timeout(25000),
    });
    const result = await response.json() as { ok?: boolean; message?: string };
    if (!response.ok || result.ok !== true) {
      return Response.json({ ok: false, message: result.message || 'Google 저장을 확인하지 못했습니다.' }, { status: 502 });
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ ok: false, message: '저장 결과를 확인하지 못했습니다. 답안은 유지됩니다. 다시 제출해 주세요.' }, { status: 502 });
  }
}
