import { useCallback } from 'react';
import ReactFlow, {
  Node,
  addEdge,
  Background,
  Edge,
  Connection,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';

import CustomNode from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

interface FlowProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

const BasicFlow = (props: FlowProps) => {
  const onConnect = useCallback(
    (params: Edge | Connection) => props.setEdges((els) => addEdge(params, els)),
    [props.setEdges]
  );
  return (
    <ReactFlow
      nodes={props.nodes}
      edges={props.edges}
      onNodesChange={props.onNodesChange}
      onEdgesChange={props.onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
    >
      <Background />
    </ReactFlow>
  );
};

export default BasicFlow;
