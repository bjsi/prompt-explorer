import { AppEvents, declareIndexPlugin, filterAsync, ReactRNPlugin, RemType, RichTextInterface, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import {apiKeyId, completionPowerupCode, promptParamPowerupCode, promptPowerupCode, testInputCode, afterSlotCode, workflowCode, beforeSlotCode, tutorCode, stopCode, temperatureCode, modelCode, triggerSequenceCode, triggerIfCode } from '../lib/consts';
import {getWorkflowPrompts, runWorkflow} from '../lib/workflow';
import {runPrompt} from '../lib/prompt';
import {useSelectionAsFirstParameter} from '../lib/parameters';
import * as R from 'remeda';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerPowerup(
    'Tutor',
    tutorCode,
    "Register prompt as a tutor",
    {
      slots: []
    }
  )

  await plugin.app.registerPowerup(
    'Workflow',
    workflowCode,
    "Register prompt chain as a workflow",
    {
      slots: [
      {
        name: "trigger sequence",
        code: triggerSequenceCode,
        hidden: false
      },
      {
        name: "trigger sequence if",
        code: triggerIfCode,
        hidden: false
      }
      ]
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
        name: "model",
        code: modelCode,
        hidden: false
      },
      {
        name: "temperature",
        code: temperatureCode,
        hidden: false
      },
      {
        name: "stop",
        code: stopCode,
        hidden: false
      },
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

    const results = await Promise.all(runs)
    console.log(results)
  }

  // await plugin.app.registerCommand({
  //   id: "auto-branch",
  //   name: "Auto Branch",
  //   action: () => {
  //   }
  // })

  // listen for key sequence triggers
  plugin.event.addListener(
    AppEvents.EditorTextEdited,
    undefined,
    async (line: RichTextInterface) => {
      const selection = await plugin.editor.getSelectedText();
      if (!selection) return;
      const prevLineRichText = await plugin.richText.substring(line, 0, selection.range.start);
      const prevLineString = await plugin.richText.toString(prevLineRichText);
      // TODO: trigger the most specific workflow match
      if (prevLineString.endsWith("+++")) {
        const focusedRem = await plugin.focus.getFocusedRem();
        const pw = await plugin.powerup.getPowerupByCode(workflowCode)!;
        const workflows = (await pw?.taggedRem()) || [];
        const filteredWorkflows = await filterAsync(workflows, (async w => {
          const x = await w.getPowerupProperty(workflowCode, triggerIfCode)
          if (!x) {
            return false
          }
          function isDescriptorAnswer() {
            return focusedRem?.type === RemType.DESCRIPTOR && prevLineRichText.some(x => x.i === 's')
          }
          let f = eval(x);
          return await f();
        }))
        const workflow = filteredWorkflows[0];
        if (workflow) {
          await plugin.editor.deleteCharacters(3, -1)
          await runWorkflow(plugin, workflow, {}, {focusedRemId: focusedRem?._id, isCommandCallback: true})
        }
      }
    }
  );

  await plugin.app.registerCommand({
    id: "test",
    name: "Test",
    description: "",
    action: async () => {
      const t = await plugin.editor.getFocusedEditorText();
      console.log(t);
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
    'generic_tutor',
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
    }
  )

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

  // await plugin.app.registerWidget(
  //   "suggest_prompts",
  //   WidgetLocation.DocumentBelowTitle,
  //   {
  //     dimensions: { height: 'auto', width: 'auto' },
  // )

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
        id: workflow._id,
        name,
        action,
      })
    }
  })
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
