import { ServiceError } from '../errors/index.js';

export async function safeGet(
  url: string,
  headers?: Record<string, string>,
): Promise<string> {
  let resp: Response;
  try {
    resp = await fetch(url, { headers });
  } catch (e) {
    throw new ServiceError(`GET ${url} failed`, { cause: e });
  }
  if (!resp.ok) throw new ServiceError(`GET ${url} returned ${resp.status}`);
  return resp.text();
}

export async function safeGetJson<T>(
  url: string,
  headers?: Record<string, string>,
): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, { headers });
  } catch (e) {
    throw new ServiceError(`GET ${url} failed`, { cause: e });
  }
  if (!resp.ok) throw new ServiceError(`GET ${url} returned ${resp.status}`);
  return resp.json() as Promise<T>;
}

export async function safePost<T>(
  url: string,
  params: Record<string, string>,
): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams(params),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (e) {
    throw new ServiceError(`POST ${url} failed`, { cause: e });
  }
  if (!resp.ok) throw new ServiceError(`POST ${url} returned ${resp.status}`);
  return resp.json() as Promise<T>;
}
