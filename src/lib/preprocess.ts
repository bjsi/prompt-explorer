import {filterAsync, Rem, RichTextElementRemInterface, RNPlugin} from "@remnote/plugin-sdk";
import {promptPowerupCode} from "./consts";
import {getCodeFromTransformer, isPromptParameter} from "./postprocess";
import * as R from 'remeda';

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

const mapToProcessorType = async (plugin: RNPlugin, x: RichTextElementRemInterface): Promise<Assignment | Code | undefined> => {
  if (await isPromptParameter(plugin, x._id)) {
    return {
      type: 'assignment',
      text: (await plugin.rem.findOne(x.aliasId))!.text[0] as string,
    }
  }
  else {
    const code = await getCodeFromTransformer(plugin, x._id)
    if (!code) return undefined
    return {
      type: 'code',
      text: code
    }
  }
}

// TODO: can be either a list
// - before -- `getArticleTitle` => [[title]]
// or a nested list of multiple assignments
// - before --
//  - `getConceptName` => [[title]]
//  - `getConceptDefinition` => [[definition]]
// return [[]] of pre-processors
const getAllPreProcessComputations = async (plugin: RNPlugin, rem: Rem) => {
  const allPPs = 
    ((await rem?.getPowerupPropertyAsRichText(promptPowerupCode, "before")) || [])
     .filter(x => x.i == 'q') as RichTextElementRemInterface[]
  if (allPPs.length > 0) {
    const preProcessComputation = await Promise.all(allPPs.map(x => mapToProcessorType(plugin, x)))
    return [R.compact(preProcessComputation)];
  }
  else {
    // TODO: lazy
    const slot = (await rem.getChildrenRem()).find(x => x.text[0] === 'before');
    const preProcessComputationRems = await filterAsync((await slot?.getChildrenRem()) || [], x => x.isPowerupPropertyListItem())
    const preProcessComputations: (Assignment | Code)[][] = []
    for (const preProcessComputationRem of preProcessComputationRems) {
      const preProcessComputation = R.compact(
        await Promise.all((preProcessComputationRem.text.filter(x => x.i === 'q') as RichTextElementRemInterface[]).map(x => mapToProcessorType(plugin, x))
      ));
      preProcessComputations.push(preProcessComputation);
    }
    return preProcessComputations;
  }
}

// idea: each pre process step gets evaluated and updates the state with some assignment at the end
const evalPreprocessors = async (
  plugin: RNPlugin,
  rem: Rem,
  state: Record<string, any> = {},
) => {
  const newState = {...state};
  const allPreProcessCompuations = await getAllPreProcessComputations(plugin, rem)
  for (const computation of allPreProcessCompuations) {
    let lastRes: any = undefined
    for (let i = 0; i < computation.length; i++) {
      const step = computation[i];
      if (step.type == "code") {
        
        // Add special pre process fns here

        let f = eval(step.text)
        let newRes = await f(lastRes)
        lastRes = newRes
      }
      else {
        state[step.text] = lastRes
      }

      if (i == computation.length -1 ) {
        lastRes = undefined;
      }
    }
  }
  return newState;
}
