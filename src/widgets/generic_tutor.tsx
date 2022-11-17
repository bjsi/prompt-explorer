import { usePlugin, renderWidget, useTracker, useRunAsync, LoadingSpinner, filterAsync, RichTextEditor, RemRichTextEditor, Rem, RemHierarchyEditorTree } from '@remnote/plugin-sdk';
import React from 'react'
import {promptPowerupCode, tutorCode} from '../lib/consts';
import { completeTextPrompt } from '../lib/gpt';
import {getParametersFromPromptRem} from '../lib/parameters';
import {runPrompt} from '../lib/prompt';
import * as R from 'remeda';

const MAX_SHORT_TERM_MEM_LEN = 6

// TODO:
// find and replace in all messages
// brainstorm 
// classify answer in terms of the descriptor it could be assigned to
// slider determining how many words must match


export function Chatbot() {
  const plugin = usePlugin();
  const tutors = useTracker(async () => {
    const pu = await plugin.powerup.getPowerupByCode(tutorCode)
    return await pu?.taggedRem();
  }, []) || []

  const chatbot = tutors[0];

  const requiredPromptParams = useRunAsync(async () => {
    const allParams = await getParametersFromPromptRem(plugin, chatbot)
    return allParams.filter(x => !["short term memory", "question"].includes(x.name));
  }, [chatbot])

  const [relatedNotes, setRelatedNotes] = React.useState<Rem[]>([]);

  const [promptArgsState, setPromptArgsState] = React.useState<Record<string, string>>({});
  
  const userMessageRemId = useRunAsync(() => plugin.rem.createRem(),[])?._id
  const userMessageRem = useTracker((rp) => rp.rem.findOne(userMessageRemId), [userMessageRemId]);
  const [history, setHistory] = React.useState<string[]>([]);
  const shortTermMemory = history.slice(-6)
  const [keywords, setKeywords] = React.useState<string[]>([])
  
  // parallel search
  // filter rem texts containing at least two keywords
  async function search() {
    const searches = (await Promise.all(keywords.map(k => plugin.search.search([k], undefined, {numResults: 5})))).flat()
    const results = (await Promise.all(searches.map(async s => {
      let rems: Rem[] = []
      if (await s.isDocument()) {
        rems = rems.concat(await s.allRemInDocumentOrPortal())
      }
      else {
        rems = rems.concat(s)
      }
      return await filterAsync(rems, async x => (await plugin.richText.toString(x.text)).search(new RegExp(keywords.join('|'), 'gim')) != -1)
    }))).flat()
    return results
  }

  const similarKeywords = async (wordList: string[]) => {
    if (wordList.length == 0) {
      return []
    }
    const res = await completeTextPrompt(plugin, `
Brainstorm five keywords related to ${wordList.slice(0, -1).join(', ')} and ${wordList[wordList.length - 1]}:
1.`.trim(), {temperature: 0.85})
    const similarWords = res?.trim().split('\n').flatMap(x => x.replace(/^\d\.\s*/, '')) || []
    return similarWords
  }

  const extractKeywords = async () => {
    const res = await completeTextPrompt(plugin, `
Extract the three most important keywords in the following dialog:

DIALOG:
"""
${shortTermMemory.join('\n')}
"""

Top three most important keywords:
1.`.trim())
    const words = res?.trim().split('\n').flatMap(x => x.replace(/^\d\.\s*/, '').trim().replace(/^"/, '').replace(/"$/, "")) || [];
    return words
  }

  React.useEffect(() => {
    const eff = async () => {
      const words = await extractKeywords();
      debugger;
      const similar = await similarKeywords(words)
      const allWords = R.uniq(words.concat(similar).map(x => x.toLowerCase())).filter(x => !!x)
      setKeywords(allWords)
    }
    if (history.length > 0 && history.length % 2 === 0) {
      eff();
    }
  }, [history])

  React.useEffect(() => {
    const eff = async () => {
      const res = R.uniqBy(await search(), x => x._id)
      setRelatedNotes(res)
    }
    if (keywords.length > 0) {
      eff();
    }
  }, [keywords])

  // // a summary of the entire conversation so far
  // const longTermMemory = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const sendMsg = async () => {
    if (chatbot) {
      const userMessage = (await plugin.richText.toString(userMessageRem?.text || [])).trim()
      if (!userMessage) {
        return;
      }
      const unsuppliedParam = requiredPromptParams?.find(x => !promptArgsState[x.name])
      if (unsuppliedParam) {
        plugin.app.toast("unsuppliedParam: " + unsuppliedParam.name)
        return
      }
      const state = {
        ...promptArgsState,
        "short term memory": history.join('\n'),
        "question": userMessage,
      }

      const stm = [...history]
      stm.push("Human: " + userMessage)
      setHistory(stm)

      userMessageRem?.setText([])

      setLoading(true);
      const resp = await runPrompt(plugin, chatbot, state, {isCommandCallback: true})
      const response = resp?.result as string | undefined;
      if (response) {
        const withAIStm = [...stm]
        withAIStm.push("AI: " + response)
        setHistory(withAIStm)
      }
      setLoading(false);
    }
  }

  return (
    <div className="h-[100%] w-[95%] overflow-y-auto p-1">
      <div>
      {
        requiredPromptParams?.map((x, idx) => 
          <div key={idx}>
            <span>{x.name}</span>
            <input value={promptArgsState[x.name]} onChange={e => setPromptArgsState(last => ({...last, [x.name]: e.target.value}))} />
          </div>
        )
      }
      </div>
      {
        history.map((x, idx) =>
          <div key={idx} className="border border-solid p-1 rounded-md">
          {
            x
          }
          </div>
        )
      }
      {
        loading && <LoadingSpinner></LoadingSpinner>
      }
      {
        relatedNotes.length > 0 && relatedNotes.map(x =>
          <RemHierarchyEditorTree key={x._id} remId={x._id}></RemHierarchyEditorTree >
        )
      }
      <div
        className="p-1 rounded rounded-md border border-solid"
        onKeyDown={e => {
          if (e.key == "Enter" && chatbot) {
            debugger;
            sendMsg();
          }
        }}
      >
        <RemRichTextEditor
          width="95%"
          remId={userMessageRem?._id}
        />
      </div>
      <button onClick={() => sendMsg()} className="border border-solid ">Send</button>
    </div>
  )
}

renderWidget(Chatbot)
