import { usePlugin, renderWidget, useTracker } from '@remnote/plugin-sdk';
import React from 'react'
import {promptPowerupCode} from '../lib/consts';
import {runWorkflow} from '../lib/workflow';

function Chatbot() {
  const plugin = usePlugin();
  const workflows = useTracker(async () => {
    const pu = await plugin.powerup.getPowerupByCode(promptPowerupCode)
    return await pu?.taggedRem();
  }, []) || []
  const chatbot = workflows.find(wf => wf.text[0] === 'Generic Tutor');
  const [userMessage, setUserMessage] = React.useState("");

  // a stack which records the last 3 messages
  const shortTermMemory = React.useState<string[]>([]);

  // // a summary of the entire conversation so far
  // const longTermMemory = React.useState<string[]>([]);
  //
  // prompt has short term memory param - pass in state
  // pass latest userMessage as 

  return (
    <div>
    <input onChange={e => setUserMessage(e.target.value)} onKeyDown={async e => {
      if (e.key == "Enter" && chatbot) { runWorkflow(plugin, chatbot, {"short term memory": shortTermMemory.join('\n'), question: userMessage}) } }}></input>
    </div>
  )
}

renderWidget(Chatbot)
