const NARRATED_ACTION_IN_PARENTHESES =
  /\(\s*(?:se\s+)?(?:sonr(?:í|i)e|r(?:í|i)e|guiña|parpadea|suspira|mira|asiente|niega|cruza|levanta|baja|inclina|acerca|aleja|abraza|besa|sonroja|encoge|toma|respira|piensa|pausa|silencio)\b[^)\n]*\)/giu;

export function cleanNarratedActions(content: string) {
  return content
    .replace(/\*{1,2}[^*]+\*{1,2}/gu, ' ')
    .replace(NARRATED_ACTION_IN_PARENTHESES, ' ')
    .replace(/^[ \t]*[¡¿]?[ \t]*[.,;:!?]+[ \t]*(?:\n|$)/gmu, '')
    .replace(/([.!?])\1{2,}/gu, '$1')
    .replace(/[ \t]{2,}/gu, ' ')
    .replace(/[ \t]+([,.;:!?])/gu, '$1')
    .replace(/^[ \t]+|[ \t]+$/gmu, '')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}
