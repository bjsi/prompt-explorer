import { BuiltInPowerupCodes, filterAsync, Rem, RNPlugin } from "@remnote/plugin-sdk";
import {getPromptRichText} from "./prompt";
import { PromptParam } from "./types";

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
    const richTextIdxOfArgs = rem.text
      .filter(el => el.i === 'q')
      .map(el => rem.text.indexOf(el));
    const ret = []
    for (let i = 0; i < argRems.length; i++) {
      const argRem = argRems[i];
      ret.push({
        remId: argRem._id,
        name: await plugin.richText.toString(argRem.text),
        idx: richTextIdxOfArgs[i],
        promptRichText,
      })
    }
    return ret;
}
