const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const http = require("node:http");
const path = require("node:path");
const next = require("next");

let application;
let frontend;
let backend;
let frontendUrl;
let received;
let respond;
const previousBackendUrl = process.env.BACKEND_URL;
const previousNodeEnv = process.env.NODE_ENV;

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function close(server) {
  if (!server?.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections();
  });
}

before(async () => {
  backend = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    received = {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: Buffer.concat(chunks),
    };
    respond(response);
  });
  process.env.BACKEND_URL = `${await listen(backend)}/api`;
  process.env.NODE_ENV = "production";
  application = next({
    dev: false,
    dir: path.resolve(__dirname, ".."),
    hostname: "127.0.0.1",
  });
  await application.prepare();
  frontend = http.createServer(application.getRequestHandler());
  frontendUrl = await listen(frontend);
}, { timeout: 30_000 });

after(async () => {
  await close(frontend);
  await application?.close();
  await close(backend);
  if (previousBackendUrl === undefined) delete process.env.BACKEND_URL;
  else process.env.BACKEND_URL = previousBackendUrl;
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
});

function jsonResponse(response, status = 200, value = { success: true }) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}

test("batch removal forwards the DELETE candidate list, query and authorization", async () => {
  const payload = JSON.stringify({ candidateIds: ["candidate-one", "candidate-two"] });
  respond = (response) => {
    jsonResponse(response, received.body.length ? 200 : 400, {
      success: received.body.length > 0,
    });
  };
  const response = await fetch(`${frontendUrl}/api/proxy/Batches/9/candidates?source=regression`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: "test-authorization",
    },
    body: payload,
  });
  assert.equal(response.status, 200);
  assert.equal(received.method, "DELETE");
  assert.equal(received.url, "/api/Batches/9/candidates?source=regression");
  assert.equal(received.headers.authorization, "test-authorization");
  assert.equal(received.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(received.body.toString(), payload);
  assert.deepEqual(await response.json(), { success: true });
});

test("DELETE preserves UTF-8 JSON bytes without interpreting the payload", async () => {
  const payload = '{ "candidateIds": ["مرشح"], "metadata": null }\n';
  respond = (response) => jsonResponse(response);
  await fetch(`${frontendUrl}/api/proxy/Batches/9/candidates`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: payload,
  }).then((response) => response.json());
  assert.equal(received.body.toString(), payload);
});

test("bodyless DELETE remains bodyless and preserves no-content responses", async () => {
  for (const status of [204, 205]) {
    respond = (response) => response.writeHead(status).end();
    const response = await fetch(`${frontendUrl}/api/proxy/Candidates/candidate-one`, {
      method: "DELETE",
    });
    assert.equal(received.body.length, 0);
    assert.equal(received.headers.authorization, undefined);
    assert.equal(response.status, status);
    assert.equal(await response.text(), "");
  }
});

test("DELETE preserves API failures and diagnostic response headers", async () => {
  const failure = { success: false, message: "Synthetic validation failure", errors: [] };
  for (const status of [400, 401, 403, 429, 500]) {
    respond = (response) => {
      response.setHeader("X-Trace-Id", "proxy-regression-1");
      response.setHeader("X-License-State", "Expired");
      response.setHeader("Retry-After", "10");
      jsonResponse(response, status, failure);
    };
    const response = await fetch(`${frontendUrl}/api/proxy/Batches/9/candidates`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: '{"candidateIds":[]}',
    });
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), failure);
    assert.equal(response.headers.get("x-trace-id"), "proxy-regression-1");
    assert.equal(response.headers.get("x-license-state"), "Expired");
    assert.equal(response.headers.get("retry-after"), "10");
  }
});

test("GET export preserves binary bytes and download metadata", async () => {
  const bytes = Buffer.from([0x50, 0x4b, 0, 0xff, 0x80, 0x0d, 0x0a]);
  respond = (response) => {
    response.writeHead(200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="synthetic-export.xlsx"',
    });
    response.end(bytes);
  };
  const response = await fetch(`${frontendUrl}/api/proxy/Batches/9/export`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="synthetic-export.xlsx"');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
});

test("POST, PUT and PATCH preserve existing JSON forwarding", async () => {
  const payload = { title: "Synthetic exam", duration: 30 };
  respond = (response) => jsonResponse(response);
  for (const method of ["POST", "PUT", "PATCH"]) {
    const response = await fetch(`${frontendUrl}/api/proxy/Assessment/9`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 200);
    assert.equal(received.method, method);
    assert.deepEqual(JSON.parse(received.body.toString()), payload);
    await response.json();
  }
});

test("multipart POST still forwards file bytes and its generated boundary", async () => {
  respond = (response) => jsonResponse(response);
  const form = new FormData();
  form.set("file", new Blob(["synthetic-upload-content"]), "fixture.txt");
  const response = await fetch(`${frontendUrl}/api/proxy/Candidates/import`, {
    method: "POST",
    body: form,
  });
  assert.equal(response.status, 200);
  assert.match(received.headers["content-type"], /^multipart\/form-data; boundary=/);
  assert.match(received.body.toString(), /synthetic-upload-content/);
  await response.json();
});
