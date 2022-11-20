// import { usePlugin, renderWidget, useRunAsync, WidgetLocation, useTracker, LoadingSpinner } from '@remnote/plugin-sdk';
// import React from 'react';
// import {getRequiredPromptArgs} from '../lib/arguments';
// import {runPrompt, RunPromptOptions} from '../lib/prompt';

// export const PromptControls = () => {
//   const plugin = usePlugin();
//   const ctx = useRunAsync(async () => await plugin.widget.getWidgetContext<WidgetLocation.RightSideOfEditor>(), [])
//   const remId = ctx?.remId;
//   const rem = useTracker(async () => await plugin.rem.findOne(remId), [remId])
//   const [loading, setLoading] = React.useState(false);

//   if (loading) {
//     return <LoadingSpinner size="small"/>
//   }
//   return (
//     <div className="flex flex-row items-center gap-3 text-center text-xs cursor-pointer">
//       <div
//         className="px-2  rounded-md rn-clr-background-light-positive rn-clr-content-positive"
//         onClick={async () => {
//           if (rem) { 
//             setLoading(true)
//             const theRem = (await plugin.rem.findOne(rem._id))!
//             await runPrompt(plugin, theRem);
//             setLoading(false)
//           }
//         }}
//       >
//       x1
//       </div>
//       <div
//         className="px-2 text-center cursor-pointer rounded-md rn-clr-background-light-positive rn-clr-content-positive"
//         onClick={async () => {
//           if (rem) {
//             const state = await getRequiredPromptArgs(plugin, rem, {})
//             const opts: RunPromptOptions = {dontAskForArgs: true}
//             setLoading(true)
//             const runs = [
//               runPrompt(plugin, rem, state, opts),
//               runPrompt(plugin, rem, state, opts),
//               runPrompt(plugin, rem, state, opts)
//             ]
//             await Promise.all(runs)
//             setLoading(false)
//           }
//         }}
//       >
//       x3
//       </div>
//     </div>
//   );
// };

// renderWidget(PromptControls);
