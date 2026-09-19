import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '../../..');
export const privatePath = path.join(here, '.env.qa-private.json');

export function privateConfig() {
  if (fs.existsSync(privatePath)) return JSON.parse(fs.readFileSync(privatePath, 'utf8'));
  const result = { password: `Qa26!${crypto.randomBytes(12).toString('base64url')}`, users: [] };
  fs.writeFileSync(privatePath, JSON.stringify(result, null, 2));
  return result;
}

export function savePrivate(value) { fs.writeFileSync(privatePath, JSON.stringify(value, null, 2)); }

export function seedCredential() {
  const source = fs.readFileSync(path.join(root, 'Backend-API/Infrastructure/Data/DatabaseSeeder.cs'), 'utf8');
  const roles = fs.readFileSync(path.join(root, 'Backend-API/Domain/Constants/AppRoles.cs'), 'utf8');
  return { email: roles.match(/SuperAdminEmail\s*=\s*"([^"]+)"/)[1], password: source.match(/CreateAsync\(superAdminUser,\s*"([^"]+)"/)[1] };
}

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [key,
    /password|token|secret|apiKey|authorization/i.test(key) ? '[REDACTED]' : redact(val)]));
}

export class Evidence {
  constructor(name) { this.name = name; this.events = []; this.checks = []; this.startedAt = new Date().toISOString(); }
  record(event) { this.events.push(redact({ at: new Date().toISOString(), ...event })); this.save(); }
  check(name, passed, detail) {
    const check = { name, passed: !!passed, detail: redact(detail), at: new Date().toISOString() };
    this.checks.push(check); this.save(); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); return check;
  }
  save() { fs.writeFileSync(path.join(here, `${this.name}.json`), JSON.stringify({ classification: 'SIMULATED TEST: actual HTTP API calls and persisted application state; no browser or physical verification', startedAt: this.startedAt, checks: this.checks, events: this.events }, null, 2)); }
}

export class Client {
  constructor({ base = process.env.QA_API_URL ?? 'http://localhost:5221', token, evidence, identity = 'anonymous' } = {}) {
    this.base = base.replace(/\/$/, ''); this.token = token; this.evidence = evidence; this.identity = identity;
  }
  async request(method, route, body, { expectedStatus, headers = {}, timeoutMs = 30000 } = {}) {
    const started = performance.now();
    let response, data;
    try {
      response = await fetch(`${this.base}${route}`, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
      const raw = await response.text();
      try { data = JSON.parse(raw); } catch { data = raw; }
      const result = { status: response.status, ok: response.ok && data?.success !== false, data: data?.data, body: data, ms: Math.round((performance.now() - started) * 100) / 100 };
      this.evidence?.record({ identity: this.identity, method, route, request: body, response: result });
      if (expectedStatus !== undefined && response.status !== expectedStatus) throw new Error(`${method} ${route}: expected ${expectedStatus}, received ${response.status}`);
      return result;
    } catch (error) { this.evidence?.record({ identity: this.identity, method, route, error: error.message, ms: performance.now() - started }); throw error; }
  }
  get(route, options) { return this.request('GET', route, undefined, options); }
  post(route, body, options) { return this.request('POST', route, body, options); }
  put(route, body, options) { return this.request('PUT', route, body, options); }
  delete(route, options) { return this.request('DELETE', route, undefined, options); }
  async upload(route, bytes, filename, contentType) {
    const form = new FormData(); form.append('file', new Blob([bytes], { type: contentType }), filename);
    const started = performance.now();
    const response = await fetch(`${this.base}${route}`, { method: 'POST', headers: { Authorization: `Bearer ${this.token}` }, body: form });
    const body = await response.json();
    const result = { status: response.status, ok: response.ok && body?.success !== false, data: body?.data, body, ms: performance.now() - started };
    this.evidence?.record({ identity: this.identity, method: 'POST multipart', route, request: { filename, contentType, bytes: bytes.length }, response: result });
    return result;
  }
  async login(email, password) {
    const response = await this.post('/api/Auth/login', { email, password });
    if (response.ok && response.data?.accessToken) { this.token = response.data.accessToken; this.identity = email; this.user = response.data.user; }
    return response;
  }
}

export async function adminClient(evidence) {
  const client = new Client({ evidence }); const { email, password } = seedCredential();
  const result = await client.login(email, password);
  if (!result.ok) throw new Error(`Seed admin login failed: ${result.status} ${result.body?.message}`);
  return client;
}

export function must(result, context) {
  if (!result.ok) throw new Error(`${context}: ${result.status} ${JSON.stringify(result.body)}`);
  return result.data;
}
