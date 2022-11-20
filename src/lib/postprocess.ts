import {BuiltInPowerupCodes, filterAsync, Rem, RichTextElementRemInterface, RNPlugin, SetRemType} from "@remnote/plugin-sdk";
import {completionPowerupCode, promptPowerupCode} from "./consts";
import {RunPromptOptions} from "./prompt";
import * as R from 'remeda'
import { Assignment, Code, Text, getAllProcessComputations } from "./processors";


export const fallbackPostProcessors: (Assignment | Code | Text)[] = [
  {
    type: "code",
    // split
    text: "xs => xs.flatMap(x => x.split(/\\r?\\n/))",
  },
  {
    type: "code",
    // unempty
    text: "xs => xs.filter(x => !!x && x != null)"
  },
  {
    type: "code",
    // dehyphen
    text: "xs => xs.map(x => x.replace(/^-\\s*/, ''))",
  },
  {
    type: "code",
    text: "childify"
  },
]

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

export const evalPostprocessors = async (
  plugin: RNPlugin,
  rem: Rem,
  x: any,
  _state: Record<string, any> = {},
  opts: RunPromptOptions = {},
) => {
    const state = {..._state};
    let allPPs = await getAllProcessComputations(plugin, rem, "post")
    if (allPPs.length === 0) {
      allPPs = [fallbackPostProcessors];
    }
    for (const computation of allPPs) {
      let lastRes: any = x
      for (let i = 0; i < computation.length; i++) {
        const step = computation[i];
        if (step.type == "text") {
          lastRes = step.text;
        }
        else if (step.type == "code") {

          let uniq = R.uniq

          async function search(ks: string[]) {
            const searches = (await Promise.all(ks.map(k => plugin.search.search([k], undefined, {numResults: 3})))).flat()
            const results = (await Promise.all(searches.map(async s => {
              let rems: Rem[] = []
              if (await s.isDocument()) {
                rems = rems.concat(await s.allRemInDocumentOrPortal())
              }
              else {
                rems = rems.concat(s)
              }
              return await filterAsync(rems, async x => (await plugin.richText.toString(x.text)).search(new RegExp(ks.join('|'), 'gim')) != -1)
            }))).flat()
            return await Promise.all(R.uniqBy(results, x => x._id).map(x => plugin.richText.toString(x.text)))
          }

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

          let f = eval(step.text)
          let newRes = await f(lastRes)
          lastRes = newRes
        }
        // assignment
        else {
          if (i == computation.length - 1) {
            state[step.text] = lastRes
          }
          else {
            lastRes = state[step.text];
          }
        }

        if (i == computation.length -1 ) {
          lastRes = undefined;
        }
      }
    }

    return state
  }