import { BuiltInPowerupCodes, filterAsync, Rem, RNPlugin } from "@remnote/plugin-sdk";
import { PromptParam } from "./types";

export const getParametersFromPromptRem = async (
    plugin: RNPlugin,
    rem: Rem
): Promise<PromptParam[]> => {
    if (!rem) return [];
    const args = await plugin.richText.getRemIdsFromRichText(rem.text);
    const argRem = await filterAsync(
        (await plugin.rem.findMany(args)) || [],
        // TODO: find better way
        async x => !await x.hasPowerup(BuiltInPowerupCodes.Aliases)
    )
    const richTextIdxOfArgs = rem.text.filter(el => el.i === 'q').map(el => rem.text.indexOf(el));
    return argRem.map((arg, idx) => {
        return {
        remId: arg._id,
        name: arg.text,
        idx: richTextIdxOfArgs[idx],
        promptRichText: rem.text
        }
    })
}