import { AppEvents, Rem, RichTextElementInterface, RNPlugin } from "@remnote/plugin-sdk";
import { argsValuesStorageKey } from "./consts";
import {getParametersFromPromptRem} from "./parameters";
import {getPromptRichText} from "./prompt";
import { PromptParam } from "./types";


export const insertArgumentsIntoPrompt = async (
    plugin: RNPlugin,
    prompt: RichTextElementInterface[],
    args: Record<string, string>,
) => {
    const newPrompt = [...prompt];
    for (let i = 0; i < prompt.length; i++) {
        const richTextEl = prompt[i];
        if (richTextEl.i === 'q') {
          const aliasRem = await plugin.rem.findOne(richTextEl.aliasId);
          const aliasText = await plugin.richText.toString(aliasRem!.text)
          if (args[aliasText] !== undefined) {
            newPrompt[i] = args[aliasText]
          }
        }
    }
    return newPrompt;
}

// convoluted way of getting arguments for the prompt from the user by opening a modal
// and resolving a promise with what the user writes.

export const getPromptArguments = async (plugin: RNPlugin, params: PromptParam[], state: Record<string, string>) => {
    let resolve: ((args: Record<string, string> | null) => void) | undefined;
    const handleUserConfirmedArgs = (newVal: Record<string, string> | null) => {
        if (newVal && Object.keys(newVal).length > 0) {
            plugin.event.removeListener(AppEvents.StorageSessionChange, argsValuesStorageKey, handleUserConfirmedArgs)
            plugin.storage.setSession(argsValuesStorageKey, null)
            resolve?.(newVal)
            plugin.widget.closePopup();
        }
        else if (newVal == null) {
            plugin.event.removeListener(AppEvents.StorageSessionChange, argsValuesStorageKey, handleUserConfirmedArgs)
            plugin.storage.setSession(argsValuesStorageKey, null)
            resolve?.(newVal)
            plugin.widget.closePopup();
        }
    }

    const args = await new Promise<Record<string, string> | null>(async (res) => {
        resolve = res
        await plugin.storage.setSession(argsValuesStorageKey, state)
        plugin.event.addListener(AppEvents.StorageSessionChange, argsValuesStorageKey, handleUserConfirmedArgs)
        plugin.widget.openPopup('get_args', {args: params})
    });

    return args
}

export const getRequiredPromptArgs = async (
  plugin: RNPlugin,
  rem: Rem,
  state: Record<string, string>,
) => {
  const promptParams = await getParametersFromPromptRem(plugin, rem);
  if (promptParams.length > 0) {
    return {...state, ...await getPromptArguments(plugin, promptParams, state)}
  }
  else {
    return {...state}
  }
}
