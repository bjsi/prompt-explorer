import { declareIndexPlugin, filterAsync, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import {apiKeyId, completionPowerupCode, promptParamPowerupCode, promptPowerupCode, testInputCode, afterSlotCode, workflowCode, beforeSlotCode } from '../lib/consts';
import {getWorkflowPrompts, runWorkflow} from '../lib/workflow';
import {runPrompt} from '../lib/prompt';
import {useSelectionAsFirstParameter} from '../lib/parameters';
import * as R from 'remeda';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerPowerup(
    'Workflow',
    workflowCode,
    "Register prompt chain as a workflow",
    {
      slots: []
    }
  )


  await plugin.app.registerPowerup(
    'Prompt',
    promptPowerupCode,
    "GPT-3 Prompt Powerup",
    {
      // override global settings
      slots: [
      {
        name: "after",
        code: afterSlotCode,
        hidden: false,
      },
      {
        name: "before",
        code: beforeSlotCode,
        hidden: false,
      },
      {
        name: "input",
        code: testInputCode,
        hidden: false
      }]
    }
  )

  await plugin.app.registerPowerup(
    'Prompt Parameter',
    promptParamPowerupCode,
    "GPT-3 Generic Prompt Parameter",
    {
      slots: []
    }
  )

  await plugin.app.registerPowerup(
    "Completion",
    completionPowerupCode,
    "GPT-3 Completion",
    {
      // ideas: save the prompt/pipelien used to generate?
      slots: []
    }
  )
  
  const runPromptCommand = async (n: number) => {
    const focusedRem = await plugin.focus.getFocusedRem();
    if (!focusedRem) return;
    const isWorkflow = await focusedRem?.hasPowerup(workflowCode);
    let state = {}
    if (isWorkflow) {
      const firstPrompt = (await getWorkflowPrompts(focusedRem))[0];
      state = await useSelectionAsFirstParameter(plugin, firstPrompt);
    }
    else {
      state = await useSelectionAsFirstParameter(plugin, focusedRem);
    }

    const runs = R.range(0, n).map(_ =>
      isWorkflow
        ? runWorkflow(plugin, focusedRem, state)
        : runPrompt(plugin, focusedRem, state)
    )

    await Promise.all(runs)
  }

  // await plugin.app.registerCommand({
  //   id: "auto-branch",
  //   name: "Auto Branch",
  //   action: () => {
  //   }
  // })

  await plugin.app.registerCommand({
    id: "extend-cdf",
    name: "Extend CDF",
    description: "Extend CDF",
    action: async () => {
      const rem = await plugin.focus.getFocusedRem();
      const slot = await rem?.getChildrenRem()
      console.log(slot)
      // const x = await filterAsync((await focusedRem?.getChildrenRem()) || [], x => x.isPowerupPropertyListItem())
      // console.log(x);
    }
  })

  await plugin.app.registerCommand({
    id: "branch",
    name: "Branch",
    description: "Creates a clone of the currently focused Rem as a sibling",
    action: async () => {
      const rem = await plugin.focus.getFocusedRem();
      const idx = await rem?.positionAmongstSiblings();
      if (!rem || idx == null) return;
      const newRem = await plugin.rem.createRem();
      await newRem?.setParent(rem.parent, idx + 1)
      await newRem?.setText(rem.text);
    }
  })

  await plugin.app.registerCommand({
    id: "run-prompt",
    name: "Run Prompt",
    action: () => runPromptCommand(1),
  })

  await plugin.app.registerCommand({
    id: "run-prompt-3",
    name: "Run Prompt x3",
    action: () => runPromptCommand(3),
  })

  await plugin.settings.registerStringSetting({
    id: apiKeyId,
    title: 'OpenAI API Key',
    description: "Your personal OpenAI API key",
    defaultValue: '',
  });

  await plugin.app.registerWidget(
    'completion_controls',
    WidgetLocation.RightSideOfEditor,
    {
      dimensions: { height: 'auto', width: '100px' },
      powerupFilter: completionPowerupCode,
    }
  );

  await plugin.app.registerWidget(
    "get_args",
    WidgetLocation.Popup,
    {
      dimensions: { height: 'auto', width: 'auto' },
    }
  );

  await plugin.app.registerWidget(
    "test_input",
    WidgetLocation.UnderRemEditor,
    {
      dimensions: { height: 'auto', width: '100%' },
      powerupFilter: promptPowerupCode,
    }
  );

  plugin.track(async (reactivePlugin) => {
    const pw = await reactivePlugin.powerup.getPowerupByCode(workflowCode)!;
    const workflows = (await pw?.taggedRem()) || [];
    for (const workflow of workflows) {
      const name = await plugin.richText.toString(workflow.text);
      const action = async () => {
        const focusedRem = await plugin.focus.getFocusedRem();
        const rem = await plugin.rem.findOne(workflow._id);
        const firstPrompt = (await getWorkflowPrompts(rem))[0];
        const state = await useSelectionAsFirstParameter(plugin, firstPrompt);
        if (!rem?.hasPowerup(workflowCode)) {
          // TODO: auto un-register.
          console.log("Not a workflow... Maybe you removed the powerup from the workflow rem?")
          return;
        }
        if (rem) {
          await runWorkflow(plugin, rem, state, {isCommandCallback: true, focusedRemId: focusedRem?._id})
        }
      }
      plugin.app.registerCommand({
        id: name,
        name,
        action,
      })
    }
  })
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
