import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import { CreateCompletionRequest } from 'openai';
import {
  apiKeyId,
  globalDefaultMaxTokensCode,
  globalDefaultModelCode,
  maxTokensCode,
  modelCode,
  promptPowerupCode,
  stopCode,
  temperatureCode,
} from './consts';

async function getGlobalSettings(plugin: RNPlugin): Promise<CreateCompletionRequest> {
  const model =
    (await plugin.settings.getSetting<string>(globalDefaultModelCode)) || 'text-davinci-002';
  const temperature = (await plugin.settings.getSetting<number>(globalDefaultModelCode)) || 0.7;
  const max_tokens = (await plugin.settings.getSetting<number>(globalDefaultMaxTokensCode)) || 1000;
  return {
    model,
    temperature,
    top_p: 1.0,
    max_tokens,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  };
}

async function getSettingsFromRem(promptRem: Rem) {
  const opts: Partial<CreateCompletionRequest> = {};
  const model = await promptRem.getPowerupProperty(promptPowerupCode, modelCode);
  const temperature = await promptRem.getPowerupProperty(promptPowerupCode, temperatureCode);
  const stop = await promptRem.getPowerupProperty(promptPowerupCode, stopCode);
  const max_tokens = await promptRem.getPowerupProperty(promptPowerupCode, maxTokensCode);
  if (model) {
    opts['model'] = model;
  }
  if (max_tokens) {
    try {
      const num = Number.parseFloat(max_tokens);
      opts['max_tokens'] = num;
    } catch {
      console.error('Invalid max tokens setting passed to gpt complete function');
    }
  }
  if (temperature) {
    try {
      const num = Number.parseFloat(temperature);
      opts['temperature'] = num;
    } catch {
      console.error('Invalid temperature setting passed to gpt complete function');
    }
  }
  if (stop) {
    try {
      const json = JSON.parse(stop);
      opts['stop'] = json;
    } catch {
      console.error('Invalid stop setting passed to gpt complete function');
    }
  }
  return opts;
}

// james: I was getting CORS errors when I tried to use the openai lib
export async function query(plugin: RNPlugin, params = {}) {
  const apiKey = await plugin.settings.getSetting<string>(apiKeyId);
  if (!apiKey) {
    plugin.app.toast("You haven't set your API key yet. Go to the settings page to do so.");
    return undefined;
  }
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + String(apiKey),
    },
    body: JSON.stringify(params),
  };
  try {
    const response = await fetch('https://api.openai.com/v1/completions', requestOptions);
    const data = await response.json();
    return data?.choices?.[0]?.text as string | undefined;
  } catch (e) {
    console.error(e);
    plugin.app.toast('Error querying GPT-3 API');
  }
}

export async function completeRemPrompt(plugin: RNPlugin, prompt: string, promptRem: Rem) {
  const opts: CreateCompletionRequest = {
    prompt,
    ...(await getGlobalSettings(plugin)),
    ...(await getSettingsFromRem(promptRem)),
  };
  return await query(plugin, opts);
}

export async function completeTextPrompt(
  plugin: RNPlugin,
  prompt: string,
  _opts: Partial<CreateCompletionRequest> = {}
) {
  const opts: CreateCompletionRequest = {
    prompt,
    ...(await getGlobalSettings(plugin)),
    ..._opts,
  };
  return await query(plugin, opts);
}
