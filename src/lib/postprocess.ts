import {BuiltInPowerupCodes, filterAsync, Rem, RNPlugin} from "@remnote/plugin-sdk";
import {completionPowerupCode, promptParamPowerupCode, promptPowerupCode} from "./consts";

// TODO: refactor
const getTransformersFromPromptRem = async (plugin: RNPlugin, rem: Rem) => {
  const postProcessors = (await rem?.getPowerupPropertyAsRichText(promptPowerupCode, "postprocess")) || []
  if (postProcessors.length == 0) {
    console.warn("post processors empty")
  }
  const transformers = await filterAsync(postProcessors, async (x) => {
    if (x.i !== 'q') {
      return false
    }
    else {
      const rem = await plugin.rem.findOne(x._id);
      // don't include assignments
      if (rem?.text[0] === "Prompt Parameter") {
        return false
      }
      else {
        return true
      }
    }
  })
  const fns = await plugin.richText.getRemIdsFromRichText(transformers)

  const codes = []
  for (const fn of fns) {
    const fnRem = await plugin.rem.findOne(fn);
    // TODO: find better way:
    if (await fnRem?.hasPowerup(BuiltInPowerupCodes.Aliases)) {
      const codeRem = (await plugin.rem.findOne(fn))
      const codeRich = codeRem?.text || []
      const codeText = await plugin.richText.toString(codeRich);
      codes.push(codeText);
    }
  }
  return codes;
}

export const evalTransformers = async (
  plugin: RNPlugin,
  rem: Rem,
  x: string[],
) => {
    const codes = await getTransformersFromPromptRem(plugin, rem);
    for (const code of codes) {

      //
      // make helper funcs available to evaled code.

      async function childify(completions: string[]) {
        const completionPowerup = await plugin.powerup.getPowerupByCode(completionPowerupCode);
        if (!rem || !completionPowerup) {
          return;
        }
        for (const completion of completions) {
          const childRem = await plugin.rem.createRem();
          await childRem?.addTag(completionPowerup);
          await childRem?.setText([completion])
          await childRem?.setParent(rem)
        }
      }

      async function appendToParent(s: string[]) {
        if (!rem) return;
        const parentRichText = rem.text
        const richText2 = s.flat().flatMap(e => ['\n', e])
        const newRichText = parentRichText.concat(richText2).flat();
        await rem.setText(newRichText);
      }

      //
      // eval each postprocessor

      let f = eval(code)
      let res = await f(x)
      x = res
    }

    return x
  }
