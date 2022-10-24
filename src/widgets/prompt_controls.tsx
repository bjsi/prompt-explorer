import { usePlugin, renderWidget, useRunAsync, WidgetLocation, useTracker, } from '@remnote/plugin-sdk';
import {runPrompt} from '../lib/prompt';

export const PromptControls = () => {
  const plugin = usePlugin();
  const ctx = useRunAsync(async () => await plugin.widget.getWidgetContext<WidgetLocation.RightSideOfEditor>(), [])
  const remId = ctx?.remId;
  const rem = useTracker(async () => await plugin.rem.findOne(remId), [remId])

  return (
    <div className="flex flex-row items-center gap-3 text-center text-xs cursor-pointer">
      <div
        className="px-2  rounded-md rn-clr-background-light-positive rn-clr-content-positive"
        onClick={async () => {
          if (rem) runPrompt(plugin, rem)
        }}
      >
      x1
      </div>
      <div
        className="px-2 text-center cursor-pointer rounded-md rn-clr-background-light-positive rn-clr-content-positive"
        onClick={async () => {
          for (let i = 0; i < 3; i++) {
            if (rem) runPrompt(plugin, rem)
          }
        }}
      >
      x3
      </div>
    </div>
  );
};

renderWidget(PromptControls);
