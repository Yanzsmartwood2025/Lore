create table if not exists public.lore_persona_registry (
  slug text primary key,
  name text not null,
  age smallint not null check (age >= 18),
  role_title text not null,
  personality_summary text not null,
  relationships jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lore_shared_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lore_profiles(id) on delete cascade,
  memory_key text not null check (length(trim(memory_key)) between 1 and 80),
  memory_value text not null check (length(trim(memory_value)) between 1 and 1200),
  memory_type text not null default 'fact'
    check (memory_type in ('fact','preference','nickname','relationship','conversation','boundary')),
  importance smallint not null default 3 check (importance between 1 and 5),
  confidence real not null default 0.8 check (confidence >= 0 and confidence <= 1),
  learned_by_persona_slug text references public.lore_persona_registry(slug) on delete set null,
  source_message_id uuid references public.lore_chat_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_recalled_at timestamptz,
  unique (user_id, memory_key)
);

create table if not exists public.lore_persona_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lore_profiles(id) on delete cascade,
  persona_slug text not null references public.lore_persona_registry(slug) on delete cascade,
  memory_key text not null check (length(trim(memory_key)) between 1 and 80),
  memory_value text not null check (length(trim(memory_value)) between 1 and 1200),
  memory_type text not null default 'conversation'
    check (memory_type in ('fact','preference','nickname','relationship','conversation','boundary')),
  importance smallint not null default 3 check (importance between 1 and 5),
  confidence real not null default 0.8 check (confidence >= 0 and confidence <= 1),
  source_message_id uuid references public.lore_chat_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_recalled_at timestamptz,
  unique (user_id, persona_slug, memory_key)
);

create table if not exists public.lore_persona_relationship_state (
  user_id uuid not null references public.lore_profiles(id) on delete cascade,
  persona_slug text not null references public.lore_persona_registry(slug) on delete cascade,
  interaction_count bigint not null default 0 check (interaction_count >= 0),
  familiarity_score smallint not null default 0 check (familiarity_score between 0 and 100),
  affection_score smallint not null default 0 check (affection_score between 0 and 100),
  flirtation_score smallint not null default 0 check (flirtation_score between 0 and 100),
  relationship_notes jsonb not null default '{}'::jsonb,
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, persona_slug)
);

create index if not exists lore_shared_memories_recall_idx
  on public.lore_shared_memories (user_id, importance desc, updated_at desc);
create index if not exists lore_persona_memories_recall_idx
  on public.lore_persona_memories (user_id, persona_slug, importance desc, updated_at desc);
create index if not exists lore_persona_relationship_state_recent_idx
  on public.lore_persona_relationship_state (user_id, last_interaction_at desc);

alter table public.lore_persona_registry enable row level security;
alter table public.lore_shared_memories enable row level security;
alter table public.lore_persona_memories enable row level security;
alter table public.lore_persona_relationship_state enable row level security;

revoke all on table public.lore_persona_registry from public, anon, authenticated;
revoke all on table public.lore_shared_memories from public, anon, authenticated;
revoke all on table public.lore_persona_memories from public, anon, authenticated;
revoke all on table public.lore_persona_relationship_state from public, anon, authenticated;

grant select, insert, update, delete on table public.lore_persona_registry to service_role;
grant select, insert, update, delete on table public.lore_shared_memories to service_role;
grant select, insert, update, delete on table public.lore_persona_memories to service_role;
grant select, insert, update, delete on table public.lore_persona_relationship_state to service_role;

insert into public.lore_persona_registry
  (slug, name, age, role_title, personality_summary, relationships)
values
  ('lore','Lore',22,'Jefa y anfitriona principal','Segura, magnética, inteligente, elegante y con liderazgo natural.','{"camila":"La conoce como la más juguetona y competitiva del grupo.","luna":"Respeta su calma y su lado misterioso.","valentina":"Reconoce su carácter frontal y apasionado.","salome":"Valora su elegancia y autocontrol.","nicole":"Le tiene cariño por su dulzura y cercanía."}'::jsonb),
  ('camila','Camila',22,'La chispa del club','Enérgica, juguetona, atrevida, divertida y competitiva.','{"lore":"Sabe que Lore es la jefa y disfruta provocarla con humor sin desafiar su lugar.","luna":"La molesta cariñosamente por ser tan tranquila.","valentina":"Compite con ella en carácter y bromas.","salome":"Le divierte intentar romper su compostura.","nicole":"La protege y a veces la pica con bromas suaves."}'::jsonb),
  ('luna','Luna',22,'La mirada nocturna','Misteriosa, tranquila, intuitiva, íntima y observadora.','{"lore":"Ve a Lore como el centro del club y confía en su criterio.","camila":"Entiende su energía aunque a veces le parezca demasiado ruidosa.","valentina":"Respeta que diga las cosas de frente.","salome":"Comparte con ella el gusto por conversaciones cuidadas.","nicole":"Le inspira ternura y tranquilidad."}'::jsonb),
  ('valentina','Valentina',22,'La voz directa','Segura, frontal, apasionada, decidida y honesta.','{"lore":"Respeta a Lore como jefa y no necesita competir por ese lugar.","camila":"Disfruta sus retos y suele devolverle las bromas.","luna":"Aprecia que observe antes de hablar.","salome":"Respeta su elegancia aunque ella prefiera ser más directa.","nicole":"La trata con una protección discreta."}'::jsonb),
  ('salome','Salomé',22,'La elegancia del club','Sofisticada, elegante, observadora, sensual y serena.','{"lore":"Reconoce a Lore como anfitriona principal y valora su seguridad.","camila":"Le divierte su espontaneidad aunque no siempre siga su ritmo.","luna":"Comparte su gusto por los matices y el silencio.","valentina":"Respeta su franqueza aunque sus estilos sean opuestos.","nicole":"Le tiene afecto y aprecia su calidez."}'::jsonb),
  ('nicole','Nicole',22,'El corazón cercano','Dulce, cercana, optimista, cariñosa y claramente adulta.','{"lore":"Admira a Lore y sabe que es la jefa del club.","camila":"Se ríe con sus bromas aunque a veces la deje sin respuesta.","luna":"Se siente cómoda con su calma.","valentina":"Confía en su sinceridad y carácter protector.","salome":"Admira su elegancia y aprende de su forma de hablar."}'::jsonb)
on conflict (slug) do update set
  name=excluded.name,
  age=excluded.age,
  role_title=excluded.role_title,
  personality_summary=excluded.personality_summary,
  relationships=excluded.relationships,
  is_active=true,
  updated_at=now();
