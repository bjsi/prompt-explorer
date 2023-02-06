import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import * as R from 'remeda';
import { generateQuestionAnswerCardsPrompt } from '../prompts/qa';
import { completeTextPrompt } from './gpt';
import { getPromptInput } from './input';

const generateQuestionAnswerData = (text: string) => {
  const splitlines = text.split('\n').filter((x) => x.startsWith('Q:') || x.startsWith('A:'));
  const qas: { question: string; answer: string }[] = R.compact(
    splitlines.map((line, idx) => {
      if (idx % 2 === 0) {
        const question = line.match(/^Q:\s*(.*)$/)?.[1];
        const answer = splitlines[idx + 1].match(/^A:\s*(.*)$/)?.[1];
        return {
          question,
          answer,
        };
      } else {
        return undefined;
      }
    })
  ) as { question: string; answer: string }[];
  return qas;
};

export async function generate_qas(plugin: RNPlugin, sourceRem: Rem) {
  const input = await getPromptInput(plugin, sourceRem);
  if (!input) {
    return;
  }
  const prompt = generateQuestionAnswerCardsPrompt(input);
  let res = (await completeTextPrompt(plugin, prompt))?.trim();
  if (!res) {
    plugin.app.toast('Failed to generate QA cards.');
    return;
  }
  res = 'Q:' + res;
  const qas = generateQuestionAnswerData(res);
  if (qas.length === 0) {
    plugin.app.toast('Failed to generate cards. Number of QAs was 0.');
    return;
  }

  for (const qa of qas) {
    const childRem = await plugin.rem.createRem();
    await childRem?.setText([qa.question]);
    await childRem?.setBackText([qa.answer]);
    await childRem?.setParent(sourceRem);
  }
}
