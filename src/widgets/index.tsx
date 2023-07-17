import { declareIndexPlugin, ReactRNPlugin, Rem } from '@remnote/plugin-sdk';
import {
  apiKeyId,
  promptPowerupCode,
  stopCode,
  temperatureCode,
  modelCode,
  maxTokensCode,
  commandCode,
  globalDefaultModelCode,
  globalDefaultMaxTokensCode,
  globalDefaultTemperatureCode,
} from '../lib/consts';
import { runPromptRem as runPrompt } from '../lib/prompt';
import '../style.css';
import '../App.css';
import { generate_qas } from '../lib/generate_qas';
import { generate_cdf } from '../lib/generate_cdf';
import { setLoading } from '../lib/loading';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerPowerup(
    'Prompt',
    promptPowerupCode,
    'Tag a Rem with this powerup to turn it into a GPT-3 Prompt. This allows you to use slots to register the prompt as an Omnibar command and customize the completion parameters.',
    {
      // override global settings
      slots: [
        {
          name: 'model',
          code: modelCode,
          hidden: false,
        },
        {
          name: 'temperature',
          code: temperatureCode,
          hidden: false,
        },
        {
          name: 'stop',
          code: stopCode,
          hidden: false,
        },
        {
          name: 'max tokens',
          code: maxTokensCode,
          hidden: false,
        },
        {
          name: 'command name',
          code: commandCode,
          hidden: false,
        },
      ],
    }
  );

  async function childify(parentRem: Rem, completions: string[]) {
    for (const completion of completions) {
      const childRem = await plugin.rem.createRem();
      await childRem?.setText([completion]);
      await childRem?.setParent(parentRem);
    }
  }

  const runPromptCommand = async () => {

    const focusedRem = await plugin.focus.getFocusedRem();
    if (!focusedRem) return;
    try {
      await setLoading(plugin, focusedRem._id, true);
      const result = await runPrompt(plugin, focusedRem);
      await childify(focusedRem, result);
    }catch (e) {
      console.log(e);
    } finally {
      await setLoading(plugin, focusedRem._id, false);
    }
  };

  await plugin.app.registerCommand({
    id: 'run-prompt',
    name: 'Run Prompt',
    action: () => runPromptCommand(),
  });

  await plugin.app.registerCommand({
    id: 'generate-cdf',
    name: 'Generate CDF',
    action: async () => {
      const focusedRem = await plugin.focus.getFocusedRem();
      if (!focusedRem) return;
      try {
        await setLoading(plugin, focusedRem._id, true);
        await generate_cdf(plugin, focusedRem);
      } catch (e) {
        console.log(e);
      } finally {
        await setLoading(plugin, focusedRem._id, false);
      }
    },
  });

  await plugin.app.registerCommand({
    id: 'generate-qas',
    name: 'Generate QAs',
    action: async () => {
      const focusedRem = await plugin.focus.getFocusedRem();
      if (!focusedRem) return;
      try {
        await setLoading(plugin, focusedRem._id, true);
        await generate_qas(plugin, focusedRem);
      } catch (e) {
        console.log(e);
      } finally {
        await setLoading(plugin, focusedRem._id, false);
      }
    },
  });

  // await plugin.app.registerCommand({
  //   id: 'generate-cdf',
  //   name: 'Generate Clozes',
  //   action: async () => {
  //     const focusedRem = await plugin.focus.getFocusedRem();
  //     if (!focusedRem) return;
  //     await generate_clozes(plugin, focusedRem);
  //   },
  // });

  await plugin.settings.registerStringSetting({
    id: apiKeyId,
    title: 'OpenAI API Key',
    description: 'Your personal OpenAI API key',
    defaultValue: '',
  });

  await plugin.settings.registerStringSetting({
    id: globalDefaultModelCode,
    title: 'Default Completion Model',
    defaultValue: 'gpt-3.5-turbo',
  });

  await plugin.settings.registerNumberSetting({
    id: globalDefaultMaxTokensCode,
    title: 'Default Max Tokens',
    defaultValue: 1000,
  });

  await plugin.settings.registerNumberSetting({
    id: globalDefaultTemperatureCode,
    title: 'Default Temperature',
    defaultValue: 1,
  });

  plugin.track(async (rp) => {
    const promptPowerup = await rp.powerup.getPowerupByCode(promptPowerupCode)!;
    const promptRems = (await promptPowerup?.taggedRem()) || [];
    for (const promptRem of promptRems) {
      const name = await promptRem?.getPowerupProperty(promptPowerupCode, commandCode);
      if (!name) continue;
      const action = async () => {
        const focusedRem = await plugin.focus.getFocusedRem();
        const rem = await plugin.rem.findOne(promptRem._id);
        if (!rem || !focusedRem) {
          return;
        }
        const result = await runPrompt(plugin, rem);
        await childify(focusedRem, result);
      };
      plugin.app.registerCommand({
        id: promptRem._id,
        name,
        action,
      });
    }
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
