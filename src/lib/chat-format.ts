const NARRATED_ACTION_IN_PARENTHESES =
  /\(\s*(?:se\s+)?(?:sonr(?:í|i)e|r(?:í|i)e|guiña|parpadea|suspira|mira|asiente|niega|cruza|levanta|baja|inclina|acerca|aleja|abraza|besa|sonroja|encoge|toma|respira|piensa|pausa|silencio)\b[^)\n]*\)/giu;

export function cleanNarratedActions(content: string) {
  return content
    .replace(/\*[^*\n]+\*/gu, '')
    .replace(NARRATED_ACTION_IN_PARENTHESES, '')
    .replace(/[ \t]{2,}/gu, ' ')
    .replace(/[ \t]+([,.;:!?])/gu, '$1')
    .replace(/^[ \t]+|[ \t]+$/gmu, '')
    .trim();
}

export function requestsNarratedRoleplay(message: string) {
  return /\b(?:roleplay|juego\s+de\s+rol|haz\s+rol|interpreta\s+(?:a|el\s+papel)|narra\s+(?:acciones|gestos))\b/iu.test(
    message,
  );
}
