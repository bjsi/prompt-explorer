import { AppEvents, RichTextElementInterface, RNPlugin } from "@remnote/plugin-sdk";
import { argsValuesStorageKey } from "./consts";
import { PromptParam } from "./types";

export const insertArgumentsIntoPrompt = (
    prompt: RichTextElementInterface[],
    args: string[],
    params: PromptParam[]
) => {
    const newPrompt = [...prompt];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const param = params[i];
        newPrompt[param.idx] = arg;
    }
    return newPrompt;
}

// convoluted way of getting arguments for the prompt from the user by opening a modal
// and resolving a promise with what the user writes.

export const getPromptArguments = async (plugin: RNPlugin, params: PromptParam[]) => {
    let resolve: ((args: string[] | null) => void) | undefined;
    const handleUserConfirmedArgs = (newVal: string[] | null) => {
        if (newVal && newVal.length > 0) {
            plugin.event.removeListener(AppEvents.StorageSessionChange, argsValuesStorageKey, handleUserConfirmedArgs)
            resolve?.(newVal)
            plugin.widget.closePopup();
        }
        else if (newVal == null) {
            plugin.event.removeListener(AppEvents.StorageSessionChange, argsValuesStorageKey, handleUserConfirmedArgs)
            resolve?.(newVal)
            plugin.widget.closePopup();
        }
    }

    const args = await new Promise<string[] | null>(async (res) => {
        resolve = res
        plugin.event.addListener(AppEvents.StorageSessionChange, argsValuesStorageKey, handleUserConfirmedArgs)
        plugin.widget.openPopup('get_args', {args: params})
    });

    return args
}