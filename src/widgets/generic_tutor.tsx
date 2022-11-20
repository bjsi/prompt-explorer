import { usePlugin, renderWidget, useTracker, useRunAsync, LoadingSpinner, filterAsync, RichTextEditor, RemRichTextEditor, Rem, RemHierarchyEditorTree, RichText, useLocalStorageState } from '@remnote/plugin-sdk';
import React from 'react'
import { promptPowerupCode, tutorCode } from '../lib/consts';
import { completeTextPrompt } from '../lib/gpt';
import {getParametersFromPromptRem} from '../lib/parameters';
import {runPrompt} from '../lib/prompt';
import * as R from 'remeda';
import { insertArgumentsIntoPrompt } from '../lib/arguments';

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
  const promptRichText = chatbot?.text;

  const requiredPromptParams = useRunAsync(async () => {
    const allParams = await getParametersFromPromptRem(plugin, chatbot)
    return allParams.filter(x => !["short term memory", "question"].includes(x.name));
  }, [chatbot])

  const [relatedNotes, setRelatedNotes] = React.useState<Rem[]>([]);

  const [promptArgsState, setPromptArgsState] = useLocalStorageState<Record<string, string>>("promptArgsState", {});
  const [userMessage, setUserMessage] = useLocalStorageState<string>("userMessage", "");
  const [messageHistory, setHistory] = useLocalStorageState<string[]>("messageHistory", [])

  const shortTermMemory = messageHistory.slice(-MAX_SHORT_TERM_MEM_LEN)
  const [keywords, setKeywords] = React.useState<string[]>([])
  const previewPrompt = useRunAsync(async () => {
    if (promptRichText) {
      return await insertArgumentsIntoPrompt(plugin, promptRichText, promptArgsState)
    }
  }, [promptRichText, promptArgsState, requiredPromptParams])

  React.useEffect(() => {
    setPromptArgsState({...promptArgsState, "short term memory": messageHistory.slice(-MAX_SHORT_TERM_MEM_LEN).join('\n')})
  }, [messageHistory])
  
  // parallel search
  // filter rem texts containing at least two keywords
  async function search() {
    const searches = (await Promise.all(keywords.map(k => plugin.search.search([k], undefined, {numResults: 3})))).flat()
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
      const similar = await similarKeywords(words)
      const allWords = R.uniq(words.concat(similar).map(x => x.toLowerCase())).filter(x => !!x)
      setKeywords(allWords)
    }
    if (messageHistory.length > 0 && messageHistory.length % 2 === 0) {
      eff();
    }
  }, [messageHistory])

  React.useEffect(() => {
    const eff = async () => {
      const res = R.uniqBy(await search(), x => x._id)
      setRelatedNotes(res)
    }
    if (keywords.length > 0) {
      eff();
    }
  }, [keywords])

  const [loading, setLoading] = React.useState(false);
  const sendMsg = async () => {
    if (chatbot) {
      const unsuppliedParam = requiredPromptParams?.find(x => !promptArgsState[x.name])
      if (unsuppliedParam) {
        plugin.app.toast("unsuppliedParam: " + unsuppliedParam.name)
        return
      }
      const state = {
        ...promptArgsState,
        "short term memory": messageHistory.join('\n'),
        "question": userMessage,
      }

      const stm = [...messageHistory]
      stm.push("Human: " + userMessage)
      setHistory(stm)

      setUserMessage("")

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
    <div className="h-[100%] w-[97%] overflow-y-auto p-1">
      <div className="border border-solid rounded-md p-2 m-2 bg-white">
        {
          <RichText
            text={previewPrompt || []}
            width="100%"
          />
        }
      </div>
      <div className="flex flex-col">
      {
        requiredPromptParams?.map((param, idx) => 
          <div key={idx}>
            <span>{param.name}</span>
            <input value={promptArgsState[param.name]} onChange={e => setPromptArgsState(({...promptArgsState, [param.name]: e.target.value}))} />
          </div>
        )
      }
      </div>
      <div className="border border-solid rounded-md p-2 overflow-y-auto">
      {
        messageHistory.map((message, idx) =>
          <div key={idx} className="border border-solid p-1 rounded-md">
          {
            message
          }
          </div>
        )
      }
      </div>
      {
        loading && <LoadingSpinner></LoadingSpinner>
      }
      {
        relatedNotes.length > 0 && relatedNotes.slice(0, 3).map(x =>
          <div key={x._id} className="border border-solid p-2 rounded-md">
            <RichText text={x.text} width="100%"/>
          </div>
        )
      }
      <div
        className="p-1 rounded rounded-md border border-solid"
        onKeyDown={e => {
          if (!e.shiftKey && e.key == "Enter" && chatbot) {
            sendMsg();
          }
        }}
      >
        <textarea
          className={"w-[95%]"}
          value={userMessage}
          onChange={e => setUserMessage(e.target.value)}
        />
      </div>
      <button onClick={() => sendMsg()} className="border border-solid ">Send</button>
    </div>
  )
}

renderWidget(Chatbot)
