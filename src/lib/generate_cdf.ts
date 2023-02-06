import { Rem, RNPlugin, SetRemType } from '@remnote/plugin-sdk';
import { generateCDCardsPrompt } from '../prompts/cdf';
import { completeTextPrompt } from './gpt';
import { getPromptInput } from './input';
import { cleanOutput, dequote, trim } from './text_utils';
import * as R from 'remeda';

const generate_cdf_data = (text: string) => {
  const splitlines = text.split('\n').flatMap((x) => x.trim());
  const descriptorsAndValues: { descriptor: string; value: string }[] = splitlines.map((x) => {
    // not ideal
    const split = x.split(' = ');
    const descriptor = R.pipe(split[0], trim, dequote);
    let value = R.pipe(split[1], dequote, trim);
    return { descriptor, value };
  });
  return descriptorsAndValues;
};

export async function generate_cdf(plugin: RNPlugin, sourceRem: Rem) {
  const input = await getPromptInput(plugin, sourceRem);
  debugger;
  if (!input) {
    return;
  }
  let completion = await completeTextPrompt(plugin, generateCDCardsPrompt(input));
  if (!completion) {
    plugin.app.toast('Failed to generate CDF cards.');
    return;
  }
  const cleanCompletion = cleanOutput(completion);
  const descriptorsAndValues = generate_cdf_data(cleanCompletion.join('\n'));
  for (const { descriptor, value } of descriptorsAndValues) {
    if (descriptor === 'description') {
      await sourceRem.setBackText([value]);
    } else {
      const descriptorRem = await plugin.rem.createRem();
      if (value.match(/^\[.*\]$/)) {
        await descriptorRem?.setText([descriptor.toLowerCase()]);
        await descriptorRem?.setType(SetRemType.DESCRIPTOR);
        try {
          const cardItems = JSON.parse(value);
          for (let ci of cardItems) {
            const ciRem = await plugin.rem.createRem();
            await ciRem?.setText([ci]);
            await ciRem?.setParent(descriptorRem!);
            await ciRem?.setIsCardItem(true);
          }
        } catch (e) {
          console.log('Failed to add list of descriptor children: ', value);
        }
      } else {
        await descriptorRem!.setText([descriptor.toLowerCase()]);
        await descriptorRem!.setBackText([value]);
        await descriptorRem!.setType(SetRemType.DESCRIPTOR);
      }
      await descriptorRem!.setParent(sourceRem);
    }
  }
}
