import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import { CreateCompletionRequest } from 'openai';
import {
  apiKeyId,
  globalDefaultMaxTokensCode,
  globalDefaultModelCode,
  globalDefaultTemperatureCode,
  maxTokensCode,
  modelCode,
  promptPowerupCode,
  stopCode,
  temperatureCode,
} from './consts';

async function getGlobalSettings(plugin: RNPlugin): Promise<CreateCompletionRequest> {
  const model =
    (await plugin.settings.getSetting<string>(globalDefaultModelCode)) || 'gpt-3.5-turbo';
  const temperature =
    (await plugin.settings.getSetting<number>(globalDefaultTemperatureCode)) || 0.7;
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
    if (response.status !== 200) {
      if (response.status === 401 || response.status === 404) {
        plugin.app.toast('Your API key is invalid. Go to the settings page to fix it.');
        return undefined;
      } else if (response.status === 429) {
        plugin.app.toast(
          'You hit the openAI rate limit, or your max monthly spend. Try again later.'
        );
        return undefined;
      }
    }
    const data = await response.json();
    const result = data?.choices?.[0]?.message.content as string | undefined;
    console.log('GPT-3 result:', result);
    return result;
  } catch (e) {
    console.error(e);
    plugin.app.toast(`Error querying GPT-3 API: ${e}`);
  }
}

export async function completeRemPrompt(plugin: RNPlugin, prompt: string, promptRem: Rem) {
  const opts: CreateCompletionRequest = {
    ...(await getGlobalSettings(plugin)),
    ...(await getSettingsFromRem(promptRem)),
    ...{"messages":[{"role":'user',"content":prompt}]},
  };
  return await query(plugin, opts);
}

export async function completeTextPrompt(
  plugin: RNPlugin,
  prompt: string,
  _opts: Partial<CreateCompletionRequest> = {}
) {
  const opts: CreateCompletionRequest = {
    ...{"messages":[{"role":'user',"content":prompt}]},
    ...(await getGlobalSettings(plugin)),
    ..._opts,
  };
  return await query(plugin, opts);
}
