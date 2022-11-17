import {BuiltInPowerupCodes, filterAsync, Rem, RichTextElementRemInterface, RNPlugin, SetRemType} from "@remnote/plugin-sdk";
import {completionPowerupCode, promptPowerupCode} from "./consts";
import {RunPromptOptions} from "./prompt";
import * as R from 'remeda'
import { openStdin } from "process";

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

export const isPromptParameter = async (plugin: RNPlugin, remId: string) => {
  const rem = await plugin.rem.findOne(remId);
  // don't include assignments
  if (rem?.text[0] === "Prompt Parameter") {
    return true
  }
  else {
    return false
  }
}

export const getCodeFromTransformer = async (plugin: RNPlugin, remId: string) => {
  const fnRem = await plugin.rem.findOne(remId);
  // TODO: find better way:
  if (await fnRem?.hasPowerup(BuiltInPowerupCodes.Aliases)) {
    const codeRem = (await plugin.rem.findOne(remId))
    const codeRich = codeRem?.text || []
    return (await plugin.richText.toString(codeRich)).trim();
  }
}

// TODO: refactor
export const filterTransformers = async (plugin: RNPlugin, allPPs: RichTextElementRemInterface[]) => {
  const transformers = await filterAsync(allPPs, async (x) => !await isPromptParameter(plugin, x._id))
  const fns = await plugin.richText.getRemIdsFromRichText(transformers)
  return await Promise.all(fns.map(x => getCodeFromTransformer(plugin, x)))
}

const generateQuestionAnswerData = (text: string) => {
  const splitlines = text
    .split('\n')
    .filter((x) => x.startsWith('Q:') || x.startsWith('A:'));
  const qas: { question: string; answer: string }[] = R.compact(
    splitlines.map((line, idx) => {
      if (idx % 2 === 0) {
        const question = line.match(/^Q:\s*(.*)$/)?.[1];
        const answer = splitlines[idx + 1].match(/^A:\s*(.*)$/)?.[1];
        return {
          question,
          answer,
        };
      } else {
        return undefined;
      }
    }),
  ) as { question: string; answer: string }[];
  return qas;
};

const generateCDData = (text: string) => {
  const splitlines = text.split('\n').flatMap((x) => x.trim());
  const descriptorsAndValues: { descriptor: string; value: string }[] =
    splitlines.map((x) => {
      // not ideal
      const split = x.split(' = ');
      const descriptor = split[0].trim();
      let value = split[1].trim();
      if (value.startsWith('"')) {
        value = value.slice(1);
      }
      if (value.endsWith('"')) {
        value = value.slice(0, -1);
      }
      return { descriptor, value };
    });
  return descriptorsAndValues;
};

export const evalTransformers = async (
  plugin: RNPlugin,
  rem: Rem,
  x: string[],
  opts: RunPromptOptions = {},
) => {
    const allPPs = await getAllPostProcessors(rem)
    let codes = R.compact(await filterTransformers(plugin, allPPs));
    if (allPPs.length === 0) {
      codes = fallbackPostProcessors;
    }
    for (const code of codes) {

      //
      // make helper funcs available to evaled code.
      async function CDFify(completions: string) {
        const sourceRem = await plugin.rem.findOne(opts.focusedRemId)
        if (!sourceRem) {
          return;
        }
        const descriptorsAndValues = generateCDData(completions)
        for (const { descriptor, value } of descriptorsAndValues) {
          if (descriptor === 'description') {
            await sourceRem.setBackText([value])
          } else {
            const descriptorRem = await plugin.rem.createRem()
            if (value.match(/^\[.*\]$/)) {
              await descriptorRem?.setText([descriptor.toLowerCase()])
              await descriptorRem?.setType(SetRemType.DESCRIPTOR)
              try {
                const cardItems = JSON.parse(value);
                for (let ci of cardItems) {
                  const ciRem = await plugin.rem.createRem()
                  await ciRem?.setText([ci])
                  await ciRem?.setParent(descriptorRem!);
                  await ciRem?.setIsCardItem(true);
                }
              } catch (e) {
                console.log('Failed to add list of descriptor children: ', value);
              }
            } else {
              await descriptorRem!.setText([descriptor.toLowerCase()])
              await descriptorRem!.setBackText([value])
              await descriptorRem!.setType(SetRemType.DESCRIPTOR);
            }
            await descriptorRem!.setParent(sourceRem);
          }
        }
      }

      async function answerify(completions: string) {
        const rem = await plugin.rem.findOne(opts.focusedRemId);
        await rem?.setBackText([completions])
        return completions;
      }

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
        return completions
      }

      async function childifyQAs(completions: string[]) {
        const text = 'Q: ' + completions.join('\n')
        const data = generateQuestionAnswerData(text);
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
