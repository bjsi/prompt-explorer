import { declareIndexPlugin, filterAsync, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import {apiKeyId, completionPowerupCode, promptParamPowerupCode, promptPowerupCode } from '../lib/consts';
import {updateWorkflowState} from '../lib/assigment';
import {runWorkflow} from '../lib/workflow';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerPowerup(
    'Prompt',
    promptPowerupCode,
    "GPT-3 Prompt Powerup",
    {
      // override global settings
      slots: [{
        name: "then",
        code: "postprocess",
        hidden: false,
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

  await plugin.app.registerCommand({
    id: "workflow",
    name: "workflow",
    action: async () => {
      runWorkflow(plugin);
    }
  })

  await plugin.settings.registerStringSetting({
    id: apiKeyId,
    title: 'OpenAI API Key',
    description: "Your personal OpenAI API key",
    defaultValue: '',
  });

  await plugin.app.registerWidget(
    'prompt_controls',
    WidgetLocation.RightSideOfEditor,
    {
      dimensions: { height: 'auto', width: '100px' },
      powerupFilter: promptPowerupCode,
    }
  );

  await plugin.app.registerWidget(
    "get_args",
    WidgetLocation.Popup,
    {
      dimensions: { height: 'auto', width: 'auto' },
    }
  )
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
