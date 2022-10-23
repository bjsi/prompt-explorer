import * as R from 'remeda';
import { usePlugin, renderWidget, useRunAsync, WidgetLocation, useTracker, SelectionType, RichTextInterface, RichTextElementInterface } from '@remnote/plugin-sdk';
import {completionPowerupCode} from '../lib/consts';
import {complete} from '../lib/gpt';

export const CompletionControls = () => {
  const plugin = usePlugin();
  const ctx = useRunAsync(async () => await plugin.widget.getWidgetContext<WidgetLocation.RightSideOfEditor>(), [])
  const remId = ctx?.remId;

  return (
    <div className="flex flex-row items-center gap-1 text-center text-xs cursor-pointer">
      <div
        className="px-2  rounded-md rn-clr-background-light-positive rn-clr-content-positive"
        onClick={async () => {
          const rem = await plugin.rem.findOne(remId);
          const rt = rem?.text || [];
          const text = await plugin.richText.toString(rt);
          if (text.includes('\n')) {
            const xs = text.split(/\r?\n/).map(x => x.replace(/^-\s*/, '')).filter(x => !!x)
            const parentRem = await plugin.rem.findOne(rem?.parent || undefined)
            const completionPowerup = await plugin.powerup.getPowerupByCode(completionPowerupCode);
            if (!parentRem || !completionPowerup) {
              return;
            }
            for (const x of xs) {
              const childRem = await plugin.rem.createRem();
              await childRem?.addTag(completionPowerup);
              await childRem?.setText([x])
              await childRem?.setParent(parentRem, 99999)
            }
            await rem?.remove();
          }
        }}
      >
      split
      </div>
      <div
        className="px-2 text-center cursor-pointer rounded-md rn-clr-background-light-positive rn-clr-content-positive"
        onClick={async () => {
          const sel = await plugin.editor.getSelection();
          const richText: RichTextElementInterface[][] = [];
          const r = await plugin.rem.findOne(remId);
          if (sel?.type === SelectionType.Rem) {
            sel.remIds.forEach(async r => {
              const rem = await plugin.rem.findOne(r);
              richText.push(rem?.text || []);
            })
          }
          else {
            richText.push(r?.text || []);
          }
          const parentRem = await plugin.rem.findOne(r?.parent || undefined);
          if (parentRem) {
            const parentRichText = parentRem.text
            const richText2 = richText.flat().flatMap(e => ['\n-', e])
            const newRichText = parentRichText.concat(richText2).flat();
            parentRem.setText(newRichText)
          }
        }}
      >
      ^
      </div>
      {
      // <div
      //   className="px-1 text-center cursor-pointer rounded-md rn-clr-background-light-positive rn-clr-content-warning"
      //   onClick={async () => {
      //     const rem = await plugin.rem.findOne(remId)
      //     await rem?.remove()
      //   }}
      // >
      // X
      // </div>
      }
    </div>
  );
};

renderWidget(CompletionControls);
