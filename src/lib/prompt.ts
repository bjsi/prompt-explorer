import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import { completeRemPrompt } from './gpt';
import { cleanOutput } from './text_utils';

export const getPromptRichText = async (plugin: RNPlugin, rem: Rem) => {
  const firstRichTextEl = rem.text[0];
  const rt =
    typeof firstRichTextEl == 'object' && '_id' in firstRichTextEl && firstRichTextEl._id
      ? (await plugin.rem.findOne(firstRichTextEl._id))!.text
      : rem.text;
  return await plugin.richText.trim(rt);
};

export const runPromptRem = async (plugin: RNPlugin, promptRem: Rem): Promise<string[]> => {
  const promptRichText = await getPromptRichText(plugin, promptRem);
  const finalPromptStr = await plugin.richText.toString(promptRichText);
  const completion = await completeRemPrompt(plugin, finalPromptStr, promptRem);
  return completion ? cleanOutput(completion) : [];
};
