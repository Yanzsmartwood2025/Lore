create index if not exists lore_persona_memories_persona_slug_idx
  on public.lore_persona_memories (persona_slug);
create index if not exists lore_persona_memories_source_message_id_idx
  on public.lore_persona_memories (source_message_id)
  where source_message_id is not null;
create index if not exists lore_shared_memories_learned_by_persona_slug_idx
  on public.lore_shared_memories (learned_by_persona_slug)
  where learned_by_persona_slug is not null;
create index if not exists lore_shared_memories_source_message_id_idx
  on public.lore_shared_memories (source_message_id)
  where source_message_id is not null;
create index if not exists lore_persona_relationship_state_persona_slug_idx
  on public.lore_persona_relationship_state (persona_slug);
