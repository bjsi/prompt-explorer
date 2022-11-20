import { RNPlugin, Rem, filterAsync, BuiltInPowerupCodes, RichTextElementInterface, RICH_TEXT_FORMATTING } from "@remnote/plugin-sdk";
import { beforeSlotCode, afterSlotCode, promptPowerupCode } from "./consts";
import * as R from 'remeda';

export interface Assignment {
  type: 'assignment';
  text: string;
}

export interface Code {
  type: 'code';
  text: string;
}

export interface Text {
  type: 'text';
  text: string;
}

const isPromptParameter = async (plugin: RNPlugin, remId: string) => {
  const rem = await plugin.rem.findOne(remId);
  // don't include assignments
  if (rem?.text[0] === "Prompt Parameter") {
    return true
  }
  else {
    return false
  }
}

const getCodeFromTransformer = async (plugin: RNPlugin, remId: string) => {
  const fnRem = await plugin.rem.findOne(remId);
  // TODO: find better way:
  if (await fnRem?.hasPowerup(BuiltInPowerupCodes.Aliases)) {
    const codeRem = (await plugin.rem.findOne(remId))
    const codeRich = codeRem?.text || []
    return (await plugin.richText.toString(codeRich)).trim();
  }
}

const mapToProcessorType = async (plugin: RNPlugin, x: RichTextElementInterface): Promise<Assignment | Code | Text | undefined> => {
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

export const getAllProcessComputations = async (plugin: RNPlugin, rem: Rem, prePost: "pre" | "post") => {
  const code = prePost == "pre" ? beforeSlotCode : afterSlotCode
  const allPPs = (await rem?.getPowerupPropertyAsRichText(promptPowerupCode, code))
  if (allPPs) {
    const processComputation = await Promise.all(allPPs.map(x => mapToProcessorType(plugin, x)))
    return [R.compact(processComputation)];
  }
  else {
    const s = await plugin.powerup.getPowerupSlotByCode(promptPowerupCode, code);
    if (!s) {
      return [];
    }
    const slot = (await rem.getChildrenRem()).find(x => x.text[0]?._id === s._id);
    const processComputationRems = await filterAsync((await slot?.getChildrenRem()) || [], x => x.isPowerupPropertyListItem())
    const processComputations: (Assignment | Code | Text)[][] = []
    for (const processComputationRem of processComputationRems) {
      const processComputation = R.compact(
        await Promise.all((processComputationRem.text).map(x => mapToProcessorType(plugin, x))
      ));
      processComputations.push(processComputation);
    }
    return processComputations;
  }
}
