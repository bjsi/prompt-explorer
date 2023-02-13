export const generateQuestionAnswerCardsPrompt = (text: string) =>
  `You are preparing questions and answers for a test. Read the text below and create a list of questions and answers based on the text, excluding questions and answers containing dates, numbers, years or ages. Do not use full sentences, only keywords.

TEXT:
${text
  .split('\n')
  .filter((x) => !!x && x != null)
  .join('\n')}

Create five questions and keyword answers based on the TEXT. Write both questions and answers in the language of the string after TEXT: . Use the following format for each question answer pair:
Q: \${QUESTION}
A: \${ANSWER}

Q:`;
