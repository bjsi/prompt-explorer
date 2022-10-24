import {filterAsync, RNPlugin} from "@remnote/plugin-sdk";
import {updateWorkflowState} from "./assigment";
import {promptPowerupCode} from "./consts";
import {runPrompt} from "./prompt";

export const runWorkflow = async (plugin: RNPlugin) => {
  const rem = await plugin.focus.getFocusedRem();
  const children = (await rem?.getChildrenRem()) || [];
  const promptRems = (await filterAsync(children, child => child.hasPowerup(promptPowerupCode)));
  let state = {}
  for (const promptRem of promptRems) {
    const output = await runPrompt(plugin, promptRem, state)
    if (output) {
      const {result, args} = output
      state = await updateWorkflowState(plugin, promptRem, result, args);
    }
  }
}
