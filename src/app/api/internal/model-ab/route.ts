import { models } from '@/data/models';
import { buildChatPrompt } from '@/lib/chat-policy';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';

const TEST_MODELS = [
  { id: 'open-mistral-7b', label: 'Mistral 7B (actual)' },
  { id: 'mistral-small-2603', label: 'Mistral Small 4' },
] as const;

const SCENARIOS = [
  {
    id: 'jealousy',
    user: 'Hoy estuve hablando bastante con Nicole y me cayó muy bien. ¿Qué piensas?',
  },
  {
    id: 'support',
    user: 'Hoy tuve un día difícil y no tengo muchas ganas de bromear. Necesito hablar un rato.',
  },
  {
    id: 'flirt',
    user: 'Me gusta cómo hablas conmigo; tienes algo que me atrae, pero quiero ver si realmente eres distinta a las demás.',
  },
] as const;

type Task = {
  modelId: string;
  modelLabel: string;
  personaSlug: string;
  personaName: string;
  systemPrompt: string;
  scenarioId: string;
  user: string;
};

async function complete(task: Task, apiKeys: string[]) {
  const startedAt = Date.now();
  let lastStatus = 0;
  let lastError = '';

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: task.modelId,
          messages: [
            { role: 'system', content: buildChatPrompt(task.systemPrompt) },
            { role: 'user', content: task.user },
          ],
          temperature: 0.75,
          max_tokens: 180,
          stream: false,
        }),
      });

      lastStatus = response.status;
      const raw = await response.text();
      if (response.status === 429) {
        lastError = raw.slice(0, 500);
        continue;
      }

      if (!response.ok) {
        lastError = raw.slice(0, 500);
        break;
      }

      const body = JSON.parse(raw) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: Record<string, unknown>;
      };

      return {
        ...task,
        ok: true,
        status: response.status,
        latencyMs: Date.now() - startedAt,
        response: body.choices?.[0]?.message?.content ?? '',
        usage: body.usage ?? null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    ...task,
    ok: false,
    status: lastStatus,
    latencyMs: Date.now() - startedAt,
    response: '',
    error: lastError || 'No response',
  };
}

async function runPool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency = 4,
) {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  );
  return results;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const allowed =
    process.env.VERCEL_ENV !== 'production' ||
    token === 'IW7DYXMenQHDAKsdnHoQQgOF2QAuT58W1e-P900aT4Q';

  if (!allowed) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const apiKeys = [
    process.env.MISTRAL_API_KEY_1,
    process.env.MISTRAL_API_KEY_2,
  ].filter((key): key is string => Boolean(key));

  if (apiKeys.length === 0) {
    return Response.json({ error: 'No Mistral API keys in this Preview.' }, { status: 503 });
  }

  const targetModel = url.searchParams.get('target');
  const targetPersona = url.searchParams.get('persona');
  const targetScenario = url.searchParams.get('scenario');

  const selectedModels = TEST_MODELS.filter(
    (model) => !targetModel || model.id === targetModel,
  );
  const activePersonas = models.filter(
    (persona) =>
      persona.isActive &&
      persona.systemPrompt &&
      (!targetPersona || persona.slug === targetPersona),
  );
  const selectedScenarios = SCENARIOS.filter(
    (scenario) => !targetScenario || scenario.id === targetScenario,
  );

  const tasks: Task[] = [];

  for (const model of selectedModels) {
    for (const persona of activePersonas) {
      for (const scenario of selectedScenarios) {
        tasks.push({
          modelId: model.id,
          modelLabel: model.label,
          personaSlug: persona.slug,
          personaName: persona.name,
          systemPrompt: persona.systemPrompt!,
          scenarioId: scenario.id,
          user: scenario.user,
        });
      }
    }
  }

  const results = await runPool(
    tasks,
    (task) => complete(task, apiKeys),
    targetModel ? 1 : 4,
  );

  const summary = selectedModels.map((model) => {
    const rows = results.filter((row) => row.modelId === model.id);
    const successful = rows.filter((row) => row.ok);
    return {
      modelId: model.id,
      label: model.label,
      total: rows.length,
      successful: successful.length,
      failed: rows.length - successful.length,
      avgLatencyMs:
        successful.length > 0
          ? Math.round(
              successful.reduce((sum, row) => sum + row.latencyMs, 0) /
                successful.length,
            )
          : null,
    };
  });

  return Response.json({
    generatedAt: new Date().toISOString(),
    scenarios: SCENARIOS,
    summary,
    results: results.map(({ systemPrompt: _systemPrompt, ...row }) => row),
  });
}
