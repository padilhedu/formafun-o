/**
 * Assinafy API client — JWT auth with in-memory token cache.
 * SERVER-SIDE ONLY. Never import in client components.
 */

const BASE_URL = 'https://api.assinafy.com.br/v1';

export interface AsssinafyDoc {
  id: string;
  name: string;
  status: string;
  external_id: string | null;
  signers: AssinafySigner[];
  signed_file?: string;
  signed_url?: string;
  [key: string]: unknown;
}

export interface AssinafySigner {
  id: string;
  name: string;
  email: string;
  status: string;
  sign_url?: string;
  signing_url?: string;
  link?: string;
  [key: string]: unknown;
}

export interface AssinafyWebhookPayload {
  event: string;
  document?: AsssinafyDoc;
  signer?: AssinafySigner;
  external_id?: string;
  [key: string]: unknown;
}

// In-memory JWT cache (resets on cold start — acceptable for serverless)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000; // 50 min

export async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const email = process.env.ASSINAFY_EMAIL;
  const password = process.env.ASSINAFY_PASSWORD;
  if (!email || !password) throw new Error('ASSINAFY_EMAIL ou ASSINAFY_PASSWORD não configurado');

  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Assinafy login failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { token?: string; access_token?: string; data?: { token?: string } };
  // Log full response structure once to confirm field names
  console.log('[Assinafy login response keys]', Object.keys(data));

  const token = data.token ?? data.access_token ?? (data.data as { token?: string } | undefined)?.token;
  if (!token) throw new Error(`Assinafy login: token field not found in response: ${JSON.stringify(data)}`);

  cachedToken = token;
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  return token;
}

export function invalidateToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

/** Generic authenticated fetch. Retries once on 401 with fresh token. */
export async function assinafyFetch(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 && retry) {
    invalidateToken();
    return assinafyFetch(path, options, false);
  }

  return res;
}

/** Extract sign_url from signer object — field name may vary across API versions */
export function extractSignUrl(signer: AssinafySigner): string | null {
  return signer.sign_url ?? signer.signing_url ?? signer.link ?? null;
}

/** Extract signed PDF URL from document object — field name may vary */
export function extractSignedPdfUrl(doc: AsssinafyDoc): string | null {
  return doc.signed_file ?? doc.signed_url ?? null;
}
