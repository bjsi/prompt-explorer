import { renderWidget, usePlugin, useRunAsync, useTracker } from '@remnote/plugin-sdk';
import React from 'react';
import { Edge, Node, useEdgesState, useNodesState } from 'reactflow';
import BasicFlow from '../components/Flow';
import { Sidebar, SidebarItem } from '../components/Sidebar';
import { promptParamPowerupCode, promptPowerupCode } from '../lib/consts';
import * as R from 'remeda';

export function FlowWidget() {
  const plugin = usePlugin();

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
    },
    { id: '2', data: { label: 'Node 2' }, position: { x: 100, y: 100 } },
    { id: '3', data: { label: 'Node 3' }, position: { x: 400, y: 100 } },
    {
      id: '4',
      type: 'custom',
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
  ]);

  const prompts =
    useTracker(async () => {
      const promptPowerup = await plugin.powerup.getPowerupByCode(promptPowerupCode);
      const prompts = R.uniqBy((await promptPowerup?.taggedRem()) || [], (x) => x._id);
      return prompts;
    }) || [];

  const sidebarItems: SidebarItem[] =
    useRunAsync(
      () =>
        Promise.all(
          prompts.map(async (prompt) => {
            const alias = (await prompt.getAliases())[0];
            return {
              id: prompt._id,
              name: await plugin.richText.toString(alias?.text || prompt.text),
            };
          })
        ),
      [prompts]
    ) || [];

  return (
    <div className="relative h-auto">
      <div className="h-[2000px]">
        {
          <BasicFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setEdges={setEdges}
            setNodes={setNodes}
          />
        }
      </div>
      <Sidebar
        items={sidebarItems}
        onItemSelect={(item) => {
          setNodes((last) => [
            ...last,
            { id: item.id, data: { label: item.name }, position: { x: 250, y: 5 } },
          ]);
        }}
      />
    </div>
  );
}

renderWidget(FlowWidget);
