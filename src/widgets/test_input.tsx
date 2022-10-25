import { usePlugin, renderWidget, useRunAsync, WidgetLocation, useTracker, } from '@remnote/plugin-sdk';
import React from 'react';
import {promptPowerupCode, testInputCode} from '../lib/consts';
import {PromptOutput, runPrompt} from '../lib/prompt';

export function TestInput() {
  const plugin = usePlugin();
  const ctx = useRunAsync(async () => await plugin.widget.getWidgetContext<WidgetLocation.RightSideOfEditor>(), [])
  const remId = ctx?.remId;
  const [refresh, setRefresh] = React.useState(0)
  const rem = useTracker(async () => await plugin.rem.findOne(remId), [remId, refresh])
  const testInput = useRunAsync(async () => await rem?.getPowerupProperty(promptPowerupCode, testInputCode), [rem])

  const [testOutput, setTestOutput] = React.useState<PromptOutput>() 

  const [show, setShow] = React.useState(true);
  if (!testInput || !rem) {
    return null;
  }
  return(
    <div className="mx-2 p-1 border border-solid rounded-md border-gray-200">
    <div className="flex flex-row gap-1">
      <div>Test Output</div>
      <button onClick={async() => {
        if (testInput && rem) {
          const o = await runPrompt(plugin, rem)
          setTestOutput(o)
        }
      }}>↻</button>
      <button onClick={() => setShow(!show)}>🔘</button>
    </div>
    {
      show && (
        <pre>
        {
          JSON.stringify(testOutput, null, 2)
        }
        </pre>
      )
    }
    </div>
  )
}

renderWidget(TestInput);
