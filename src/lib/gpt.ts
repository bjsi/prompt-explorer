import {RemId, RNPlugin} from "@remnote/plugin-sdk";
import { Configuration, OpenAIApi } from "openai";
import {apiKeyId} from "./consts";

async function getGlobalModelSettings() {
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

async function getSettingsFromRem(plugin: RNPlugin, r: RemId | undefined) {
  const rem = await plugin.rem.findOne(r);
  if (rem) {
    // model: "text-davinci-002",
    // prompt,
    // temperature: 0.7,
    // top_p: 1.0,
    // max_tokens: 1000,
    // frequency_penalty: 0.0,
    // presence_penalty: 0.0,
    return {}
  }
  return {}
}

export async function complete(
  plugin: RNPlugin,
  prompt: string,
  rId?: RemId
) {
  const apiKey = await plugin.settings.getSetting<string>(apiKeyId)
  const configuration = new Configuration({ apiKey });
  const openai = new OpenAIApi(configuration);
  const opts = {
    prompt,
    ...await getGlobalModelSettings(),
    ...await getSettingsFromRem(plugin, rId),
  }
  const res = await openai.createCompletion(opts);
  return res.data.choices?.[0]?.text
}
