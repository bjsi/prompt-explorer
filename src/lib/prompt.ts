import {Rem, RemId, RNPlugin} from "@remnote/plugin-sdk"
import {getRequiredPromptArgs, insertArgumentsIntoPrompt} from "./arguments"
import {updateState} from "./assigment"
import {completionPowerupCode, promptPowerupCode, testInputCode} from "./consts"
import {createInstanceOfGenericPrompt} from "./generic"
import {complete} from "./gpt"
import {getParametersFromPromptRem} from "./parameters"
import {evalTransformers} from "./postprocess"

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

export interface PromptOutput {
  args: Record<string, string>
  result: string[]
}

export const runPrompt = async (
  plugin: RNPlugin,
  rem: Rem,
  state: Record<string, string> = {},
  opts: RunPromptOptions = {}
): Promise<PromptOutput | undefined> => {
  const completePowerup = await plugin.powerup.getPowerupByCode(completionPowerupCode)
  const promptPowerup = await plugin.powerup.getPowerupByCode(promptPowerupCode)
  if (!completePowerup || !promptPowerup) {
    console.error("Couldn't find completePowerup or promptPowerup");
    return
  }
  const promptRichText = await getPromptRichText(plugin, rem);
  let finalPromptRichText = [...promptRichText];
  state = {...state, ...runBefore}

  // need !opts.dontAskForArgs to avoid potential infinite loop?
  const isGeneric = !opts.dontAskForArgs && (await getParametersFromPromptRem(plugin, rem)).length > 0;
  const promptArgs = opts.dontAskForArgs
    ? state
    : await getRequiredPromptArgs(plugin, rem, state)
  if (promptArgs != null) {
    finalPromptRichText = await insertArgumentsIntoPrompt(plugin, finalPromptRichText, { ...state, ...promptArgs });
  }
  const testInput = await rem.getPowerupProperty(promptPowerupCode, testInputCode)
  let res;
  if (testInput) {
    console.log("Running prompt in test mode")
    res = {
      result: await evalTransformers(plugin, rem, [testInput]),
      args: promptArgs
    }
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
      const completion = await complete(plugin, textPrompt, rem._id)
      console.log(completion)
      if (!completion) {
        return
      }
      res = {
        result: await evalTransformers(plugin, rem, [completion], opts),
        args: promptArgs
      }
    }
  }

  return {...res, args: await updateState(plugin, rem, res.result, res.args)}
}
