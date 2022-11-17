import {filterAsync, Rem, RichTextElementInterface, RichTextElementRemInterface, RICH_TEXT_FORMATTING, RNPlugin, SelectionType} from "@remnote/plugin-sdk";
import {beforeSlotCode, promptPowerupCode} from "./consts";
import {getCodeFromTransformer, isPromptParameter} from "./postprocess";
import * as R from 'remeda';
import { RunPromptOptions } from "./prompt";

export const fallbackPreProcessors = [
]

interface Assignment {
  type: 'assignment';
  text: string;
}

interface Code {
  type: 'code';
  text: string;
}

interface Text {
  type: 'text';
  text: string;
}

export const mapToProcessorType = async (plugin: RNPlugin, x: RichTextElementInterface): Promise<Assignment | Code | Text | undefined> => {
  if (x.i === 'q') {
    if (await isPromptParameter(plugin, x._id)) {
      return {
        type: 'assignment',
        text: (await plugin.rem.findOne(x.aliasId))!.text[0] as string,
      }
    }
    // TODO:
    else if (x.aliasId != null) {
      const code = await getCodeFromTransformer(plugin, x._id)
      if (!code) return undefined
      return {
        type: 'code',
        text: code
      }
    }
  }
  else {
    if (x.i == 'm' && x[RICH_TEXT_FORMATTING.QUOTE]) {
      if (x.text.match(/^".*"$/)) {
        return {
          type: 'text',
          text: x.text.slice(1, -1),
        }
      }
      else {
        return {
          type: 'code',
          text: x.text,
        }
      }
    }
  }
}

const getAllPreProcessComputations = async (plugin: RNPlugin, rem: Rem) => {
  const allPPs = (await rem?.getPowerupPropertyAsRichText(promptPowerupCode, "before"))
  if (allPPs) {
    const preProcessComputation = await Promise.all(allPPs.map(x => mapToProcessorType(plugin, x)))
    return [R.compact(preProcessComputation)];
  }
  else {
    const s = await plugin.powerup.getPowerupSlotByCode(promptPowerupCode, beforeSlotCode);
    if (!s) {
      return [];
    }
    const slot = (await rem.getChildrenRem()).find(x => x.text[0]?._id === s._id);
    const preProcessComputationRems = await filterAsync((await slot?.getChildrenRem()) || [], x => x.isPowerupPropertyListItem())
    const preProcessComputations: (Assignment | Code | Text)[][] = []
    for (const preProcessComputationRem of preProcessComputationRems) {
      const preProcessComputation = R.compact(
        await Promise.all((preProcessComputationRem.text).map(x => mapToProcessorType(plugin, x))
      ));
      preProcessComputations.push(preProcessComputation);
    }
    return preProcessComputations;
  }
}

// idea: each pre process step gets evaluated and updates the state with some assignment at the end
export const evalPreprocessors = async (
  plugin: RNPlugin,
  rem: Rem,
  state: Record<string, any> = {},
  opts: RunPromptOptions = {}
) => {
  const newState = {...state};
  const allPreProcessCompuations = await getAllPreProcessComputations(plugin, rem)
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
