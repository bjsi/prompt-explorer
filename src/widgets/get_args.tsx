import { usePlugin, renderWidget, useRunAsync, WidgetLocation, useSessionStorageState, RichText, RichTextEditor, } from '@remnote/plugin-sdk';
import {argsValuesStorageKey } from '../lib/consts';
import {PromptParam, } from '../lib/types';
import React from 'react';
import { insertArgumentsIntoPrompt } from '../lib/arguments';

export const GetArgumentsModal = () => {
  const plugin = usePlugin();
  const ctx = useRunAsync(() => plugin.widget.getWidgetContext<WidgetLocation.Popup>(), [])
  const [inputValues, setInputValues] = React.useState<Record<string, string>>({});
  const [existingArgValues, setArgValues] = useSessionStorageState<Record<string, string> | null>(argsValuesStorageKey, {})
  React.useEffect(() => {
    if (existingArgValues && Object.keys(existingArgValues || {}).length > 0) {
      setInputValues(existingArgValues || {})
    }
  }, [existingArgValues])
  const promptParams = ((ctx?.contextData.args || []) as PromptParam[]);
  const promptRichText = promptParams[0]?.promptRichText || [];
  const previewPrompt = useRunAsync(async () => await insertArgumentsIntoPrompt(plugin, promptRichText, inputValues), [promptRichText, inputValues, promptParams])

  console.log(existingArgValues)

  return (
    <div className="p-2 w-[400px] max-w-[400px]">
    <div>
      {
        <RichTextEditor className="w-[400px]" readOnly text={previewPrompt || []} />
      }
    </div>
    {
      ((ctx?.contextData.args || []) as PromptParam[]).map((arg) =>
        <div className="flex gap-2 p-2">
          {
            arg.name
          }
          <input
            value={inputValues[arg.name]}
            onChange={e => {
              const newValue = {...inputValues, [arg.name]: e.target.value}
              setInputValues(newValue);
            }}
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
