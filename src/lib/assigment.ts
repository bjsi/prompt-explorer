import {Rem, RichTextElementRemInterface, RNPlugin} from "@remnote/plugin-sdk";
import {promptParamPowerupCode, promptPowerupCode} from "./consts";

const assignToStateVar = async (
  plugin: RNPlugin,
  rt: RichTextElementRemInterface,
  value: string,
  state: Record<string, string>
) => {
  const q = await plugin.rem.findOne(rt._id)
  const pw = await plugin.powerup.getPowerupByCode(promptParamPowerupCode)
  if (q && pw && q._id === pw._id) {
    const alias = await plugin.rem.findOne(rt.aliasId);
    const aliasText = await plugin.richText.toString(alias!.text);
    return {...state, [aliasText]: value}
  }
  return state
}

export const updateState = async (
  plugin: RNPlugin,
  promptRem: Rem,
  output: unknown,
  state: Record<string, string>
) => {
  const postProcesses = (await promptRem.getPowerupPropertyAsRichText(promptPowerupCode, 'postprocess')).filter(el => el.i == 'q') as RichTextElementRemInterface[];
  const lastProcess = postProcesses[postProcesses.length - 1]
  return await assignToStateVar(plugin, lastProcess, output, state)
}
