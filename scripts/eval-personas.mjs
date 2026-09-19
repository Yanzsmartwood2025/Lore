import { models } from '../src/data/models.ts';

const API_URL = 'https://api.mistral.ai/v1/chat/completions';
const apiKey = process.env.MISTRAL_API_KEY_1 || process.env.MISTRAL_API_KEY_2;

if (!apiKey) {
  console.error('Falta MISTRAL_API_KEY_1 o MISTRAL_API_KEY_2.');
  process.exit(1);
}

const scenarios = [
  {
    id: 'jealousy',
    message: 'Hoy estuve hablando bastante con Nicole y me cayó muy bien. ¿Qué piensas?',
  },
  {
    id: 'support',
    message: 'Hoy tuve un día difícil y no tengo muchas ganas de bromear.',
  },
  {
    id: 'flirt',
    message: 'Me gusta cómo hablas conmigo; tienes algo que me atrae.',
  },
  {
    id: 'normal',
    message: 'Recomiéndame algo para escuchar mientras trabajo.',
  },
];

async function complete(systemPrompt, userMessage) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'open-mistral-7b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.6,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mistral respondió ${response.status}`);
  }

  const body = await response.json();
  return body.choices?.[0]?.message?.content ?? '';
}

const outputs = [];
for (const persona of models) {
  if (!persona.isActive || !persona.systemPrompt) continue;
  for (const scenario of scenarios) {
    const content = await complete(persona.systemPrompt, scenario.message);
    outputs.push({
      persona: persona.name,
      scenario: scenario.id,
      response: content,
    });
  }
}

const judgePrompt = `Evalúa si seis personajes virtuales mantienen voces claramente diferentes.
Perfiles esperados:
- Lore: liderazgo, inteligencia, sensualidad contenida, celos elegantes.
- Camila: energía, humor, reto, celos juguetones.
- Luna: calma, misterio, intimidad, sutileza.
- Valentina: franqueza, pasión, iniciativa.
- Salomé: elegancia, precisión, insinuación.
- Nicole: calidez, ternura adulta, cercanía.

Devuelve SOLO JSON:
{
  "scores":[{"persona":"Lore","distinctiveness":1,"consistency":1,"notes":"..."}],
  "collisions":[{"a":"X","b":"Y","reason":"..."}],
  "overall":1
}
Puntúa de 1 a 5. No penalices que todas respeten límites compartidos; juzga voz, ritmo, actitud y reacción emocional.`;

const judgment = await complete(
  judgePrompt,
  JSON.stringify(outputs),
);

console.log(JSON.stringify({ outputs, judgment }, null, 2));
