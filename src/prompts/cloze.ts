export const generateClozeCardsPrompt = (
  text: string
) => `You are a teacher creating clozes for your students by wrapping all of the important nouns, names and adjectives with a special \${cloze} tag.

Example:
\${Spaced repetition} is an evidence-based learning technique that is usually performed with \${flashcards}. Newly introduced and more difficult flashcards are shown more frequently, while older and less difficult flashcards are shown less frequently in order to exploit the psychological \${spacing} effect. The use of spaced repetition has been proven to increase the \${rate} of learning. The \${spacing} effect was first noticed by German scientist \${Hermann Ebbinghaus}.

Turn the important nouns, names and adjectives in the following text into \${clozes}:
"${text}"
`;
