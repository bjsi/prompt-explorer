import {BuiltInPowerupCodes, Rem, RNPlugin} from "@remnote/plugin-sdk";
import {completionPowerupCode, promptPowerupCode} from "./consts";

const getPostProcessorsFromPromptRem = async (plugin: RNPlugin, rem: Rem) => {
  const rt = await rem?.getPowerupPropertyAsRichText(promptPowerupCode, "postprocess")
  const fns = await plugin.richText.getRemIdsFromRichText(rt || [])

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

export const evalPostProcesses = async (
  plugin: RNPlugin,
  rem: Rem,
  x: string[],
) => {
    const codes = await getPostProcessorsFromPromptRem(plugin, rem);
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
      if (Array.isArray(res)) {
        // TODO: move flat into postprocessors
        x = res.flat()
      }
      else {
        break;
      }
    }

    return x
  }
