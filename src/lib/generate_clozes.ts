import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import * as R from 'remeda';
import { generateClozeCardsPrompt } from '../prompts/cloze';
import { completeTextPrompt } from './gpt';
import { getPromptInput } from './input';

const allStartingIndexesOfSubstring = (source: string, searchFor: string) => {
  const idxs = [];
  let indexOccurence = source.indexOf(searchFor, 0);
  while (indexOccurence >= 0) {
    idxs.push(indexOccurence);
    indexOccurence = source.indexOf(searchFor, indexOccurence + 1);
  }
  return idxs;
};

const generateClozeData = (gptResponse: string, sourceText: string) => {
  // gpt-3 doesn't always copy the text word-for-word, so extract the cloze words
  // and then re-find the words inside the source text to make sure we get the correct
  // index.
  const beginsWithCloze = gptResponse.trim().startsWith('${');
  const split = gptResponse
    .trim()
    .split('${')
    .flatMap((x) => x.split('}'))
    .filter((x) => !!x && x != null);
  const clozeWords = R.compact(
    split.map((x, i) => {
      if (beginsWithCloze ? i % 2 == 0 : i % 2 !== 0) {
        return x;
      } else {
        return null;
      }
    })
  );
  const allClozeCandidates = clozeWords.flatMap((clozeWord) => {
    const is = allStartingIndexesOfSubstring(sourceText, clozeWord);
    return is.map((idx) => ({ idx, len: clozeWord.length }));
  });
  const filtered = [];
  for (const cloze of allClozeCandidates) {
    const overlappers = allClozeCandidates.filter(
      (otherCloze) =>
        otherCloze.idx >= cloze.idx &&
        otherCloze.idx <= cloze.idx + cloze.len &&
        cloze !== otherCloze
    );
    if (overlappers.length > 0) {
      filtered.push(R.maxBy(overlappers, (x) => x.len) as { idx: number; len: number });
    } else {
      filtered.push(cloze);
    }
  }
  return R.uniqBy(filtered, (x) => x.idx);
};

export const generate_clozes = async (plugin: RNPlugin, sourceRem: Rem) => {
  const input = await getPromptInput(plugin);
  if (!input) {
    return;
  }
  const prompt = generateClozeCardsPrompt(input);
  let res = (await completeTextPrompt(plugin, prompt))?.trim();
};
