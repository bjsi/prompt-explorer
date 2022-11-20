import { RNPlugin, SelectionType } from '@remnote/plugin-sdk';

export const getPromptInput = async (plugin: RNPlugin) => {
  const sel = await plugin.editor.getSelection();
  let input: string | undefined;
  if (!sel) {
    const focusedRem = await plugin.focus.getFocusedRem();
    if (!focusedRem) {
      return;
    }
    input = await plugin.richText.toString(focusedRem.text);
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
  else if (sel?.type === SelectionType.Text) {
    input = await plugin.richText.toString(sel.richText);
  }
  return input;
};
