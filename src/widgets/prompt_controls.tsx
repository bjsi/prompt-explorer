import { usePlugin, renderWidget, useRunAsync, WidgetLocation, useTracker, BuiltInPowerupCodes, filterAsync, RICH_TEXT_FORMATTING, AppEvents } from '@remnote/plugin-sdk';
import React from 'react';
import { getPromptArguments, insertArgumentsIntoPrompt } from '../lib/arguments';
import {argsValuesStorageKey, completionPowerupCode, promptPowerupCode} from '../lib/consts';
import {complete} from '../lib/gpt';
import { getParametersFromPromptRem } from '../lib/parameters';
import {evalPostProcesses} from '../lib/postprocess';

export const PromptControls = () => {
  const plugin = usePlugin();
  const ctx = useRunAsync(async () => await plugin.widget.getWidgetContext<WidgetLocation.RightSideOfEditor>(), [])
  const remId = ctx?.remId;
  const rem = useTracker(async () => await plugin.rem.findOne(remId), [remId])
  const completePowerup = useRunAsync(async () => await plugin.powerup.getPowerupByCode(completionPowerupCode), [])
  const promptPowerup = useRunAsync(async () => await plugin.powerup.getPowerupByCode(promptPowerupCode), [])
  const promptRichText = rem?.text || []

  const run = async () => {
    if (!promptRichText || !rem || !completePowerup || !promptPowerup) {
      return
    }
    const promptParams = await getParametersFromPromptRem(plugin, rem);
    let finalPromptRichText = [...promptRichText];
    if (promptParams.length > 0) {
      const promptArguments = await getPromptArguments(plugin, promptParams);
      if (promptArguments != null) {
        finalPromptRichText = insertArgumentsIntoPrompt(finalPromptRichText, promptArguments, promptParams);
      }
      else {
        return;
      }
    }
    const textPrompt = await plugin.richText.toString(finalPromptRichText);
    const res = await complete(plugin, textPrompt, remId)
    if (!res) {
      return
    }
    let y = await evalPostProcesses(plugin, rem, [res])
  }

  return (
    <div className="flex flex-row items-center gap-3 text-center text-xs cursor-pointer">
      <div
        className="px-2  rounded-md rn-clr-background-light-positive rn-clr-content-positive"
        onClick={async () => {
          run()
        }}
      >
      x1
      </div>
      <div
        className="px-2 text-center cursor-pointer rounded-md rn-clr-background-light-positive rn-clr-content-positive"
        onClick={async () => {
          for (let i = 0; i < 3; i++) {
            run()
          }
        }}
      >
      x3
      </div>
    </div>
  );
};

renderWidget(PromptControls);
