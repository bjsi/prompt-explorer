import {filterAsync, Rem, RichTextElementRemInterface, RNPlugin} from "@remnote/plugin-sdk";
import {promptPowerupCode} from "./consts";
import {filterTransformers, getCodeFromTransformer, isPromptParameter} from "./postprocess";
import * as R from 'remeda';

export const fallbackPreProcessors = [
]

const mapToProcessorType = async (plugin: RNPlugin, x: RichTextElementRemInterface) => {
  if (await isPromptParameter(plugin, x._id)) {
    return {
      type: 'assignment',
      text: (await plugin.rem.findOne(x.aliasId))!.text[0],
    }
  }
  else {
    return {
      type: 'code',
      text: getCodeFromTransformer(plugin, x._id)
    }
  }
}

// TODO: can be either a list
// - before -- `getArticleTitle` => [[title]]
// or a nested list of multiple assignments
// - before --
//  - `getConceptName` => [[title]]
//  - `getConceptDefinition` => [[definition]]
const getAllPreProcessors = async (plugin: RNPlugin, rem: Rem) => {
  let allPPs = 
    ((await rem?.getPowerupPropertyAsRichText(promptPowerupCode, "before")) || [])
     .filter(x => x.i == 'q') as RichTextElementRemInterface[]

  if (allPPs.length == 0) {
    // TODO: lazy
    const slot = (await rem.getChildrenRem()).find(x => x.text[0] === 'before');
    const stepRems = await filterAsync((await slot?.getChildrenRem()) || [], x => x.isPowerupPropertyListItem())
    const x = await Promise.all(
      stepRems
        .map(x => (x.text.filter(x => x.i === 'q') as RichTextElementRemInterface[])
        .map(x => mapToProcessorType(plugin, x)))
    )
  }
  else {
    return allPPs.map(x => mapToProcessorType(plugin, ))
  }
}

const evalPreprocessors = async (plugin: RNPlugin, rem: Rem, state:Record<string, any> = {}) => {
  const allPPs = await getAllPreProcessors(rem)
  const _eval = async () => {
  }
  if (allPPs[0]?.constructor === Array)) {
    for 
  }
  let codes = await filterTransformers (plugin, allPPs);
  if (allPPs.length === 0) {
    codes = fallbackPreProcessors;
  }
}
