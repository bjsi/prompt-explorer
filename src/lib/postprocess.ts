import {BuiltInPowerupCodes, filterAsync, Rem, RichTextElementRemInterface, RNPlugin} from "@remnote/plugin-sdk";
import {completionPowerupCode, promptPowerupCode} from "./consts";
import {RunPromptOptions} from "./prompt";

export const fallbackPostProcessors = [
  "xs => xs.flatMap(x => x.split(/\\r?\\n/))", // split
  "xs => xs.filter(x => !!x && x != null)", // unempty
  "xs => xs.map(x => x.replace(/^-\\s*/, ''))", // dehyphen
  "childify"
]

const getAllPostProcessors = async (rem: Rem) => {
  const allPPs = (await rem?.getPowerupPropertyAsRichText(promptPowerupCode, "postprocess")) || []
  return allPPs.filter(x => x.i == 'q') as RichTextElementRemInterface[];
}


// TODO: refactor
const getTransformersFromPromptRem = async (plugin: RNPlugin, rem: Rem) => {
  const allPPs = await getAllPostProcessors(rem);
  const transformers = await filterAsync(allPPs, async (x) => {
    const rem = await plugin.rem.findOne(x._id);
    // don't include assignments
    if (rem?.text[0] === "Prompt Parameter") {
      return false
    }
    else {
      return true
    }
  })
  const fns = await plugin.richText.getRemIdsFromRichText(transformers)

  const codes = []
  for (const fn of fns) {
    const fnRem = await plugin.rem.findOne(fn);
    // TODO: find better way:
    if (await fnRem?.hasPowerup(BuiltInPowerupCodes.Aliases)) {
      const codeRem = (await plugin.rem.findOne(fn))
      const codeRich = codeRem?.text || []
      const codeText = await plugin.richText.toString(codeRich)
      codes.push(codeText.trim());
    }
  }
  return codes;
}

export const generateQuestionAnswerData = (text: string) => {
  const splitlines = text.split('\n').filter(x => x.startsWith('Q:') || x.startsWith('A:'));
  const qas: { question: string; answer: string }[] = splitlines
    .map((line, idx) => {
        if (idx % 2 === 0) {
          const question = line.match(/^Q:\s*(.*)$/)?.[1];
          const answer = splitlines[idx+1].match(/^A:\s*(.*)$/)?.[1];
          return {
            question,
            answer,
        };
      }
    })
    .filter((x) => x != null) as { question: string; answer: string }[];
  return qas;
};

export const evalTransformers = async (
  plugin: RNPlugin,
  rem: Rem,
  x: string[],
  opts: RunPromptOptions = {},
) => {
    const allPPs = await getAllPostProcessors(rem)
    let codes = await getTransformersFromPromptRem(plugin, rem);
    if (allPPs.length === 0) {
      codes = fallbackPostProcessors;
    }
    for (const code of codes) {

      //
      // make helper funcs available to evaled code.

      async function childify(completions: string[]) {
        const completionPowerup = await plugin.powerup.getPowerupByCode(completionPowerupCode);
        if (!rem || !completionPowerup) {
          return;
        }
        const parent = opts.isCommandCallback ? await plugin.focus.getFocusedRem() : rem;
        if (!parent) {
          return;
        }
        for (const completion of completions) {
          const childRem = await plugin.rem.createRem();
          await childRem?.addTag(completionPowerup);
          await childRem?.setText([completion])
          await childRem?.setParent(parent)
        }
      }

      async function childifyQAs(completions: string[]) {
        const data = generateQuestionAnswerData(completions.join('\n'));
        const completionPowerup = await plugin.powerup.getPowerupByCode(completionPowerupCode);
        if (!rem || !completionPowerup) {
          return;
        }
        const parent = opts.isCommandCallback ? await plugin.focus.getFocusedRem() : rem;
        if (!parent) {
          return;
        }
        for (const d of data) {
          const childRem = await plugin.rem.createRem();
          await childRem?.addTag(completionPowerup);
          await childRem?.setText([d.question])
          await childRem?.setBackText([d.answer])
          await childRem?.setParent(parent)
        }
      }

      async function appendToParent(s: string[]) {
        if (!rem) return;
        const parentRichText = rem.text
        const richText2 = s.flat().flatMap(e => ['\n', e])
        const newRichText = parentRichText.concat(richText2).flat();
        await rem.setText(newRichText);
      }

      //
      // eval each postprocessor

      let f = eval(code)
      let res = await f(x)
      x = res
    }

    return x
  }
