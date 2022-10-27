import {Rem, RichTextElementRemInterface} from "@remnote/plugin-sdk";
import {promptPowerupCode} from "./consts";

export const fallbackPreProcessors = [
]

const getAllPreProcessors = async (rem: Rem) => {
  const allPPs = (await rem?.getPowerupPropertyAsRichText(promptPowerupCode, "before")) || []
  return allPPs.filter(x => x.i == 'q') as RichTextElementRemInterface[];
}

