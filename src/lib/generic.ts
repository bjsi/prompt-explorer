import {Rem, RichTextElementInterface, RNPlugin} from "@remnote/plugin-sdk";
import {insertArgumentsIntoPrompt} from "./arguments";
import {promptPowerupCode, afterSlotCode} from "./consts";

export const createInstanceOfGenericPrompt = async (
  plugin: RNPlugin,
  genericPromptRem: Rem,
  promptRichText: RichTextElementInterface[],
  state: Record<string, string>
): Promise<Rem> => {
  const rem = await plugin.rem.createRem();
  const promptPowerup = await plugin.powerup.getPowerupByCode(promptPowerupCode)
  const finalPromptRichText = await insertArgumentsIntoPrompt(plugin, promptRichText, state);
  await rem?.setText(finalPromptRichText);
  await rem?.addTag(promptPowerup!);
  const slotsToCopy = [afterSlotCode];
  for (const slot of slotsToCopy) {
    const value = await genericPromptRem.getPowerupPropertyAsRichText(promptPowerupCode, slot);
    if (value) {
      await rem?.setPowerupProperty(promptPowerupCode, slot, value);
    }
  }
  await rem?.setParent(genericPromptRem, 99999999)
  // refind because .text is cached on the rem object
  return await plugin.rem.findOne(rem?._id);
}
