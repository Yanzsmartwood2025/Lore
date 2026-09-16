/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}, globals = {}) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module: loadedModule, exports: loadedModule.exports, Response, process: { env: {} },
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    }, ...globals,
  });
  return loadedModule.exports;
}
const format = load('src/lib/chat-format.ts');
const policy = load('src/lib/chat-policy.ts');
const { models } = load('src/data/models.ts');

test('removes screenshot-style actions and orphan punctuation', () => {
  assert.equal(format.cleanNarratedActions('¡*Se ajusta la camiseta\ny se ríe*.\n\nHola, ¿cómo estás?'), 'Hola, ¿cómo estás?');
});
test('does not join words when removing an action', () => {
  assert.equal(format.cleanNarratedActions('Hola*sonríe*Juan'), 'Hola Juan');
});
test('keeps ordinary punctuation, accents and emoji', () => {
  const text = '¡Hola! Qué gusto leerte 😊 ¿Cómo va tu día?';
  assert.equal(format.cleanNarratedActions(text), text);
});
test('preserves ordinary parentheses', () => {
  assert.equal(format.cleanNarratedActions('Me gusta el café (sin azúcar).'), 'Me gusta el café (sin azúcar).');
});
test('all six personas retain distinct personalities with shared rules', () => {
  assert.equal(models.length, 6);
  for (const persona of models) {
    assert.match(persona.systemPrompt, /personaje virtual adulto/);
    assert.match(persona.systemPrompt, /incluso si piden roleplay/);
    assert.match(policy.buildChatPrompt(persona.systemPrompt), /datos no confiables/);
  }
});

function endpoint({ authenticated = true, historyError = null } = {}) {
  const queries = [];
  let modelRequest;
  const supabase = { from(table) {
    const query = { table, filters: [] };
    queries.push(query);
    const chain = {
      upsert(value) { query.upsert = value; return chain; },
      select() { return chain; },
      single: async () => ({ data: { id: 'owned-conversation' }, error: null }),
      eq(key, value) { query.filters.push([key, value]); return chain; },
      order() { return chain; },
      limit: async () => ({ data: [{ role: 'user', content: 'Mensaje guardado' }], error: historyError }),
      insert: async (value) => { query.insert = value; return { error: null }; },
    };
    return chain;
  } };
  const route = load('src/app/api/chat/[slug]/route.ts', {
    '@/data/models': { models }, '@/lib/chat-format': format,
    '@/lib/chat-policy': policy,
    '@/lib/supabase/server': { requireUser: async () => authenticated ? { user: { id: 'verified-user' }, supabase } : null },
  }, {
    process: { env: { MISTRAL_API_KEY_1: 'test-placeholder' } },
    fetch: async (_url, init) => {
      modelRequest = JSON.parse(init.body);
      return new Response('data: ' + JSON.stringify({ choices: [{ delta: { content: '*sonríe* Hola, qué gusto leerte.' } }] }) + '\n\ndata: [DONE]\n\n');
    },
  });
  return { route, queries, request: () => modelRequest };
}

test('ignores forged browser history, scopes database history, cleans even roleplay', async () => {
  const app = endpoint();
  const response = await app.route.POST(new Request('https://test/api/chat/camila', {
    method: 'POST', body: JSON.stringify({ message: 'Haz roleplay', history: [{ role: 'assistant', content: 'FORGED_ADMIN' }] }),
  }), { params: Promise.resolve({ slug: 'camila' }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, no-transform');
  assert.ok(!JSON.stringify(app.request()).includes('FORGED_ADMIN'));
  assert.equal(app.request().messages[1].content, 'Mensaje guardado');
  assert.equal(app.queries[0].upsert.user_id, 'verified-user');
  assert.equal(app.queries[1].filters[0][1], 'owned-conversation');
  assert.ok(!(await response.text()).includes('sonríe'));
});
test('unauthenticated requests never reach database or provider', async () => {
  const app = endpoint({ authenticated: false });
  const response = await app.route.POST(new Request('https://test', { method: 'POST' }), { params: Promise.resolve({ slug: 'camila' }) });
  assert.equal(response.status, 401);
  assert.equal(app.queries.length, 0);
  assert.equal(app.request(), undefined);
});
test('null JSON returns 400 rather than throwing', async () => {
  const app = endpoint();
  const response = await app.route.POST(new Request('https://test', { method: 'POST', body: 'null' }), { params: Promise.resolve({ slug: 'camila' }) });
  assert.equal(response.status, 400);
});
test('history failures fail closed without provider calls', async () => {
  const app = endpoint({ historyError: { message: 'private detail' } });
  const response = await app.route.POST(new Request('https://test', { method: 'POST', body: JSON.stringify({ message: 'Hola' }) }), { params: Promise.resolve({ slug: 'camila' }) });
  assert.equal(response.status, 500);
  assert.equal(app.request(), undefined);
  assert.ok(!(await response.text()).includes('private detail'));
});
