import {filterAsync, Rem, RNPlugin, SelectionType} from "@remnote/plugin-sdk";
import { RunPromptOptions } from "./prompt";
import { getAllProcessComputations } from "./processors";
import { promptPowerupCode } from "./consts";

export const fallbackPreProcessors = [
]

// idea: each pre process step gets evaluated and updates the state with some assignment at the end
export const evalPreprocessors = async (
  plugin: RNPlugin,
  rem: Rem,
  state: Record<string, any> = {},
  opts: RunPromptOptions = {}
) => {
  const newState = {...state};
  const allPreProcessCompuations = await getAllProcessComputations(plugin, rem, "pre")
  for (const computation of allPreProcessCompuations) {
    let lastRes: any = undefined
    for (let i = 0; i < computation.length; i++) {
      const step = computation[i];
      if (step.type == "text") {
        lastRes = step.text;
      }
      else if (step.type == "code") {

        // Add special pre process fns here
        async function parentText() {
          const rem = await plugin.rem.findOne(opts.focusedRemId);
          const parent = await rem?.getParentRem();
          return await plugin.richText.toString(parent?.text || []);
        }

        async function remText() {
          const r = await plugin.focus.getFocusedRem()
          return await plugin.richText.toString(r?.text || []);
        }

        async function docTitle() {
          // TODO: wrong
          return await plugin.richText.toString(
            (await plugin.focus.getFocusedPortal())?.text || []
          );
        }

        async function selText() {
          //TODO: rem
          const sel = await plugin.editor.getSelection();
          if (sel?.type === SelectionType.Text) {
            return await plugin.richText.toString(sel.richText);
          }
        }

        // TODO: optimize?
        async function search() {
          const query = lastRes.trim();
          const tokens = query.split(/\s+/);
          const searchRes = await filterAsync((await plugin.search.search([query], undefined, {numResults: 20})), async x => !await x.hasPowerup(promptPowerupCode))
          console.log(searchRes)
          let remTexts: string[] = []
          for (const res of searchRes) {
            if (await res.isDocument()) {
              remTexts = remTexts.concat((await Promise.all((await res.allRemInDocumentOrPortal()).map(x => plugin.richText.toString(x.text)))))
            }
            else {
              remTexts = remTexts.concat(await plugin.richText.toString(res.text))
            }
          }
          const res = remTexts.filter(x => x?.search(new RegExp(tokens.join('|'), 'gim')) != -1).join('\n\n')
          console.log("search results", res)
          return res
        }

        let f = eval(step.text)
        let newRes = await f(lastRes)
        lastRes = newRes
      }
      // assignment TODO: refactor this
      else {
        if (i == computation.length - 1) {
          newState[step.text] = lastRes
        }
        else {
          lastRes = newState[step.text];
        }
      }

      if (i == computation.length -1 ) {
        lastRes = undefined;
      }
    }
  }
  return newState;
}
