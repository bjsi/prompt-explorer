import {Rem, RNPlugin} from "@remnote/plugin-sdk";
import { Configuration, CreateCompletionRequest, OpenAIApi } from "openai";
import {apiKeyId, modelCode, promptPowerupCode, stopCode, temperatureCode} from "./consts";

async function getGlobalModelSettings(): Promise<CreateCompletionRequest> {
  // const model = await this.plugin.settings.getSetting<string>('')
  return {
    model: "text-davinci-002",
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 1000,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  }
}

async function getSettingsFromRem(promptRem: Rem) {
  const opts: Partial<CreateCompletionRequest> = {}
  const model = await promptRem.getPowerupProperty(promptPowerupCode, modelCode)
  const temperature = await promptRem.getPowerupProperty(promptPowerupCode, temperatureCode)
  const stop = await promptRem.getPowerupProperty(promptPowerupCode, stopCode);
  if (model) {
    opts["model"] = model;
  }
  if (temperature) {
    try {
      const num = Number.parseFloat(temperature);
      opts["temperature"] = num
    }
    catch {
      console.error("Invalid temperature setting passed to gpt complete function")
    }
  }
  if (stop) { 
    try {
      const json = JSON.parse(stop)
      opts["stop"] = json
    }
    catch {
      console.error("Invalid stop setting passed to gpt complete function")
    }
  }
  return opts
}

// otherwise I get damn CORS errs
export async function query(plugin: RNPlugin, params = {}) {
  const apiKey = await plugin.settings.getSetting<string>(apiKeyId)
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + String(apiKey)
    },
    body: JSON.stringify(params)
  };
  const response = await fetch('https://api.openai.com/v1/completions', requestOptions);
  const data = await response.json();
  return data.choices[0].text;
}

export async function completeRemPrompt(
  plugin: RNPlugin,
  prompt: string,
  promptRem: Rem
) {
  const opts: CreateCompletionRequest = {
    prompt,
    ...await getGlobalModelSettings(),
    ...await getSettingsFromRem(promptRem),
  }
  return await query(plugin, opts)
}

export async function completeTextPrompt(
  plugin: RNPlugin,
  prompt: string,
  _opts: Partial<CreateCompletionRequest> = {}
) {
  const opts: CreateCompletionRequest = {
    prompt,
    ...await getGlobalModelSettings(),
    ..._opts,
  }
  return query(plugin, opts)
}
