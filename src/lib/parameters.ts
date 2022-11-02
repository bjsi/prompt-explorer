import { BuiltInPowerupCodes, filterAsync, Rem, RNPlugin, SelectionType } from "@remnote/plugin-sdk";
import {getPromptRichText} from "./prompt";
import { PromptParam } from "./types";
import * as R from 'remeda';

export const getParametersFromPromptRem = async (
    plugin: RNPlugin,
    rem: Rem
): Promise<PromptParam[]> => {
    if (!rem) return [];
    const promptRichText = await getPromptRichText(plugin, rem)
    // TODO: refactor
    const args = await plugin.richText.getRemIdsFromRichText(promptRichText);
    const argRems = await filterAsync(
        (await plugin.rem.findMany(args)) || [],
        async x => !await x.hasPowerup(BuiltInPowerupCodes.Aliases)
    )
    const ret = []
    for (let i = 0; i < argRems.length; i++) {
      const argRem = argRems[i];
      ret.push({
        remId: argRem._id,
        name: await plugin.richText.toString(argRem.text),
        promptRichText,
      })
    }
    return R.uniqBy(ret, x => x.name);
}

export const useSelectionAsFirstParameter = async (
  plugin: RNPlugin,
  promptRem: Rem
): Promise<Record<string, string>> => {
  const sel = await plugin.editor.getSelection();
  const state: Record<string, string> = {}
  if (sel && sel.type == SelectionType.Text && sel.range.start != sel.range.end) {
    const selText = await plugin.richText.toString(sel.richText)
    const params = await getParametersFromPromptRem(plugin, promptRem);
    const fstParam = params[0];
    if (fstParam) {
      state[fstParam.name] = selText
    }
  }
  return state;
}
