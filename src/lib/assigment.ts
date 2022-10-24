import {Rem, RichTextElementRemInterface, RNPlugin} from "@remnote/plugin-sdk";
import {promptParamPowerupCode, promptPowerupCode} from "./consts";

export const updateWorkflowState = async (
  plugin: RNPlugin,
  promptRem: Rem,
  output: unknown,
  state: Record<string, string>
) => {
  let newState = {...state};
  const postProcesses = (await promptRem.getPowerupPropertyAsRichText(promptPowerupCode, 'postprocess')).filter(el => el.i == 'q') as RichTextElementRemInterface[];
  const lastProcess = postProcesses[postProcesses.length - 1]
  if (lastProcess) {
    const q = await plugin.rem.findOne(lastProcess._id)
    const pw = await plugin.powerup.getPowerupByCode(promptParamPowerupCode)
    if (q && pw && q._id === pw._id) {
      const alias = await plugin.rem.findOne(lastProcess.aliasId);
      const aliasText = await plugin.richText.toString(alias!.text);
      newState = {...newState, [aliasText]: output}
    }
  }
  return newState;
}
