import {Rem, RemId, RNPlugin} from "@remnote/plugin-sdk"
import {getRequiredPromptArgs, insertArgumentsIntoPrompt} from "./arguments"
import {completionPowerupCode, promptPowerupCode} from "./consts"
import {createInstanceOfGenericPrompt} from "./generic"
import {completeRemPrompt} from "./gpt"
import {getParametersFromPromptRem} from "./parameters"
import {evalPostprocessors} from "./postprocess"
import {evalPreprocessors} from "./preprocess"

export const getPromptRichText = async (plugin: RNPlugin, rem: Rem) => {
  // deal with aliases - cleaner way?
  const rt = rem.text[0]?._id ? (await plugin.rem.findOne(rem.text[0]._id))!.text : rem.text
  return await plugin.richText.trim(rt);
}

export interface RunPromptOptions {
  dontAskForArgs?: boolean;
  isCommandCallback?: boolean;
  focusedRemId?: RemId
}

export const runPrompt = async (
  plugin: RNPlugin,
  rem: Rem,
  _state: Record<string, string> = {},
  opts: RunPromptOptions = {}
): Promise<Record<string, any> | undefined> => {
  const completePowerup = await plugin.powerup.getPowerupByCode(completionPowerupCode)
  const promptPowerup = await plugin.powerup.getPowerupByCode(promptPowerupCode)
  if (!completePowerup || !promptPowerup) {
    console.error("Couldn't find completePowerup or promptPowerup");
    return
  }
  const promptRichText = await getPromptRichText(plugin, rem);
  let finalPromptRichText = [...promptRichText];
  const state = {..._state, ...await evalPreprocessors(plugin, rem, _state, opts)}

  // need !opts.dontAskForArgs to avoid potential infinite loop?
  const isGeneric = !opts.dontAskForArgs && (await getParametersFromPromptRem(plugin, rem)).length > 0;
  const promptArgs = opts.dontAskForArgs
    ? state
    : await getRequiredPromptArgs(plugin, rem, state)
  if (promptArgs == null) {
    return;
  }
  if (promptArgs != null) {
    finalPromptRichText = await insertArgumentsIntoPrompt(plugin, finalPromptRichText, { ...state, ...promptArgs });
  }
  const testInput = await rem.getPowerupProperty(promptPowerupCode, "mock completion")
  let result;
  if (testInput) {
    console.log("Running prompt in test mode")
    result = await evalPostprocessors(plugin, rem, [testInput], promptArgs, opts)
  }
  else {
    if (isGeneric && !testInput && !opts.isCommandCallback) {
      const instance = await createInstanceOfGenericPrompt(
        plugin,
        rem,
        finalPromptRichText,
        promptArgs,
      )
      return await runPrompt(plugin, instance, promptArgs, opts)
    }
    else {
      const textPrompt = await plugin.richText.toString(finalPromptRichText);
      const completion = await completeRemPrompt(plugin, textPrompt, rem)
      console.log(completion)
      if (!completion) {
        return
      }
      result = await evalPostprocessors(plugin, rem, [completion], promptArgs, opts)
    }
  }
  console.log(result)
  return result
}
