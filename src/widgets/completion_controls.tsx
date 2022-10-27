import { usePlugin, renderWidget, useRunAsync, WidgetLocation, SelectionType, RichTextElementInterface } from '@remnote/plugin-sdk';

export const CompletionControls = () => {
  const plugin = usePlugin();
  const ctx = useRunAsync(async () => await plugin.widget.getWidgetContext<WidgetLocation.RightSideOfEditor>(), [])
  const remId = ctx?.remId;

  return (
    <div className="flex flex-row items-center gap-1 text-center text-xs cursor-pointer">
      <div
        className="px-2 text-center cursor-pointer rounded-md rn-clr-background-light-positive rn-clr-content-positive"
        onClick={async () => {
          const sel = await plugin.editor.getSelection();
          const richText: RichTextElementInterface[][] = [];
          const r = await plugin.rem.findOne(remId);
          // TODO:
          // - make sure sel.remIds are all siblings

          if (sel?.type === SelectionType.Rem) {
            await Promise.all(
              sel.remIds.map(async r => {
                const rem = await plugin.rem.findOne(r);
                richText.push(rem?.text || []);
              })
            )
          }
          else {
            richText.push(r?.text || []);
          }
          const parentRem = await plugin.rem.findOne(r?.parent || undefined);
          if (parentRem) {
            const parentText = (await plugin.richText.toString(
              parentRem.text
            )).trim()
            const parentTextSplit = parentText.split(/\r?\n/);
            const lastLine = parentTextSplit[parentTextSplit.length - 1]
            let richText2: RichTextElementInterface[] = [];
            if (lastLine?.startsWith('-')) {
              if (lastLine === '-') {
                richText2 = [
                  ' ',
                  richText[0],
                  ...richText.slice(1).flatMap(e => ['\n- ', e]),
                  '\n- '
                ].flat()
              }
              else {
                richText2 = [
                  ...richText.flatMap(e => ['\n- ', e]),
                  '\n- '
                ].flat()
              }
            }
            else {
              richText2 = richText
                .flat()
                .flatMap(e => ['\n', e])
            }
            const newRichText = parentRem.text.concat(richText2).flat();
            await parentRem.setText(newRichText)
            
          }
        }}
      >
      ⬆
      </div>
      {
      <div
        className="px-1 text-center cursor-pointer rounded-md rn-clr-background-light-positive rn-clr-content-warning"
        onClick={async () => {
          const rem = await plugin.rem.findOne(remId)
          await rem?.remove()
        }}
      >
      ❌
      </div>
      }
    </div>
  );
};

renderWidget(CompletionControls);
