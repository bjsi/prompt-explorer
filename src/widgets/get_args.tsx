import * as R from 'remeda';
import { usePlugin, renderWidget, useRunAsync, WidgetLocation, useTracker, SelectionType, RichTextInterface, RichTextElementInterface, useSessionStorageState, RichText } from '@remnote/plugin-sdk';
import {argsValuesStorageKey, getArgsPropsStorageKey} from '../lib/consts';
import {PromptParam, } from '../lib/types';
import React from 'react';
import { insertArgumentsIntoPrompt } from '../lib/arguments';

export const GetArgumentsModal = () => {
  const plugin = usePlugin();
  const ctx = useRunAsync(() => plugin.widget.getWidgetContext<WidgetLocation.Popup>(), [])
  const [_, setArgValues] = useSessionStorageState<string[] | null>(argsValuesStorageKey, [])
  const [inputValues, setInputValues] = React.useState<string[]>([]);
  const promptParams = ((ctx?.contextData.args || []) as PromptParam[]);
  const promptRichText = promptParams[0]?.promptRichText || [];
  const previewPrompt = insertArgumentsIntoPrompt(promptRichText, inputValues, promptParams)
  const previewPromptText = useRunAsync(async () => await plugin.richText.toString(previewPrompt), [previewPrompt])

  return (
    <div className="p-2">
    <div>
      {
        // TODO: rich text component broken
        previewPromptText
      }
    </div>
    {
      ((ctx?.contextData.args || []) as PromptParam[]).map((arg, idx) =>
        <div className="flex gap-2 p-2">
          {
            arg.name
          }
          <input
            value={inputValues[idx]}
            onChange={e => setInputValues(last => {
              const newArr = [...last]
              newArr[idx] = e.target.value
              return newArr
            })}
          />
        </div>
      )
    }
    <div className="flex justify-between">
      <button
        className=""
        onClick={_ => setArgValues(inputValues)}>
        Done
      </button>
      <button onClick={_ => setArgValues(null)}>Cancel</button>
    </div>
    </div>
  )
}

renderWidget(GetArgumentsModal)
