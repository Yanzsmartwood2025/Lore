# Chat style and security review — 2026-09-16

## Changes

- Shared short, direct conversational style; all six persona-specific descriptions remain.
- No narrated actions or roleplay exception. Removing actions inserts whitespace instead of joining words.
- Non-explicit romance and flirting remain possible, without pressure or pretending to be human. Neutral conversation when a user identifies as a minor.
- System instructions identify conversation content as untrusted and refuse internal-data requests. This is defense in depth, not a guaranteed prompt-injection defense.
- The endpoint ignores client-provided history, loads up to 20 messages from the conversation resolved using the verified user and persona, and projects only role/content.
- Invalid JSON objects and database history failures fail closed. Chat responses are not cacheable.
- No credentials, environment values or infrastructure tools are passed to the model. No new dependencies or database migrations.

## Research and unresolved risks

- The code still calls `open-mistral-7b`. Mistral's official page marks it retired on 2025-03-30. No replacement was selected or live API request made. Resolve model availability before production approval: https://docs.mistral.ai/models/mistral-7b-0-3
- Mistral's current usage policy does not specify a numerical sensuality threshold or promise that a request will never be refused. It prohibits, among other things, CSAM, non-consensual intimate imagery, privacy violations and bypassing safety protections. The application's non-explicit boundary is a product choice, not a claim that Mistral bans every adult sexual topic: https://legal.mistral.ai/terms/usage-policy/
- Prompt text is not a secret: persona definitions are in a public repository and shared with client components. Do not store confidential information in prompts. Keep credentials exclusively in server-side secret storage.
- Server-side history reduces browser forgery but is not a full database authorization audit. The checked-in original migration grants owners broad message write access. Verify current grants/RLS and whether legacy Supabase sessions can forge assistant rows before treating saved history as authentic. All history remains explicitly untrusted to the model.
- Distributed rate limits, request-byte limits, real age verification, provider timeout handling and live cross-account isolation tests remain follow-up work. A prompt is not an age gate.
- Do not claim zero risk of prompt extraction or injection. Apply least privilege and independent access controls: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html

## Verification

Passed: `node --test tests/chat.test.cjs` (9 tests), TypeScript no-emit and ESLint on changed files. The endpoint tests use mocked database/provider responses, not live account data. No production deployment or live Mistral validation was performed.

Before merge: verify a supported model with the account owner; run authenticated staging tests for each persona, separate users, prompt-extraction attempts, ordinary parentheses, greetings and database failure handling. Do not include real secrets in test messages.
