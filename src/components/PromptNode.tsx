import { Rem, usePlugin, useRunAsync } from '@remnote/plugin-sdk';
import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { getRequiredPromptArgs } from '../lib/arguments';

interface PromptNodeProps extends NodeProps {
  promptRem: Rem;
}

const PromptNode = (props: PromptNodeProps) => {
  const plugin = usePlugin();
  const args =
    useRunAsync(() => getRequiredPromptArgs(plugin, props.promptRem, {}), [props.promptRem]) || [];
  return (
    <>
      <Handle type="target" position={props.targetPosition} isConnectable={props.isConnectable} />
      <div className="border rounded-md">
        <div>{props.data?.label}</div>
        <div>{Object.keys(args).join(', ')}</div>
      </div>
      <Handle type="source" position={props.sourcePosition} isConnectable={props.isConnectable} />
    </>
  );
};

PromptNode.displayName = 'PromptNode';

export default memo(PromptNode);
