import {Rem, RNPlugin} from "@remnote/plugin-sdk"
import {getPromptArguments, insertArgumentsIntoPrompt} from "./arguments"
import {completionPowerupCode, promptPowerupCode} from "./consts"
import {complete} from "./gpt"
import {getParametersFromPromptRem} from "./parameters"
import {evalTransformers} from "./postprocess"

export const getPromptRichText = async (plugin: RNPlugin, rem: Rem) => {
  // deal with aliases - cleaner way?
  return rem.text[0]?._id ? (await plugin.rem.findOne(rem.text[0]._id))!.text : rem.text;
}

export const runPrompt = async (plugin: RNPlugin, rem: Rem, state: Record<string, string> = {}) => {
  const completePowerup = await plugin.powerup.getPowerupByCode(completionPowerupCode)
  const promptPowerup = await plugin.powerup.getPowerupByCode(promptPowerupCode)
  if (!completePowerup || !promptPowerup) {
    console.error("Couldn't find completePowerup or promptPowerup");
    return
  }
  const promptRichText = await getPromptRichText(plugin, rem);
  const promptParams = await getParametersFromPromptRem(plugin, rem);
  let finalPromptRichText = [...promptRichText];
  let promptArgs = {...state};
  if (promptParams.length > 0) {
    promptArgs = {...state, ...await getPromptArguments(plugin, promptParams, state)}
    if (promptArgs != null) {
      finalPromptRichText = await insertArgumentsIntoPrompt(plugin, finalPromptRichText, promptArgs);
    }
    else {
      return;
    }
  }
  const textPrompt = await plugin.richText.toString(finalPromptRichText);
  const res = await complete(plugin, textPrompt, rem._id)
  if (!res) {
    return
  }
  return {
    result: await evalTransformers(plugin, rem, [res]),
    args: promptArgs
  }
}
