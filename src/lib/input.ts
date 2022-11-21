import { Rem, RNPlugin, SelectionType } from '@remnote/plugin-sdk';

export const getPromptInput = async (plugin: RNPlugin, focusedRem: Rem) => {
  const sel = await plugin.editor.getSelection();
  let input: string | undefined;
  if (sel && sel.type === SelectionType.Text) {
    if (sel.range.start === sel.range.end) {
      input = await plugin.richText.toString(focusedRem.text);
    } else {
      input = await plugin.richText.toString(sel.richText);
    }
  }
  //   } else {
  // if (sel?.type === SelectionType.Rem) {
  //   input = (
  //     await Promise.all(
  //       ((await plugin.rem.findMany(sel.remIds)) || []).map((r) =>
  //         plugin.richText.toString(r.text)
  //       )
  //     )
  //   ).join('\n');
  return input;
};
