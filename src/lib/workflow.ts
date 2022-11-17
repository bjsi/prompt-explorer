import {filterAsync, Rem, RNPlugin} from "@remnote/plugin-sdk";
import {updateState} from "./assigment";
import {promptPowerupCode} from "./consts";
import {runPrompt, RunPromptOptions} from "./prompt";

export const getWorkflowPrompts = async (workflowRem: Rem) => {
  const children = (await workflowRem?.getChildrenRem()) || [];
  return (await filterAsync(children, child => child.hasPowerup(promptPowerupCode)));
}

export const runWorkflow = async (
  plugin: RNPlugin,
  workflowRem: Rem,
  _state: Record<string, string> = {},
  opts: RunPromptOptions = {}
) => {
  // TODO: if not workflwo rem conosole err
  const workflowPrompts = await getWorkflowPrompts(workflowRem)
  let state = {..._state}
  let result = null;
  for (const promptRem of workflowPrompts) {
    const output = await runPrompt(plugin, promptRem, state, opts)
    if (output) {
      const {args} = output
      result = output.result;
      state = await updateState(plugin, promptRem, result, args);
    }
  }
  return {result, state};
}
