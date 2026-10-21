import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export interface NodeLegendItem {
  type: string;
  label: string;
  bgColor: string;
  borderColor: string;
}

export const NODE_COLOR_LEGEND: NodeLegendItem[] = [
  {
    type: 'Repository',
    label: 'Repository',
    bgColor: '#6366F1',
    borderColor: '#C7D2FE',
  },
  {
    type: 'Commit',
    label: 'Commit',
    bgColor: '#7C3AED',
    borderColor: '#C4B5FD',
  },
  {
    type: 'PR',
    label: 'PR',
    bgColor: '#F59E0B',
    borderColor: '#FDE68A',
  },
  {
    type: 'Author',
    label: 'Author',
    bgColor: '#3B82F6',
    borderColor: '#BFDBFE',
  },
  {
    type: 'File',
    label: 'File',
    bgColor: '#10B981',
    borderColor: '#A7F3D0',
  },
  {
    type: 'Feature',
    label: 'Feature / Query',
    bgColor: '#EF4444',
    borderColor: '#FECACA',
  },
];

interface GraphViewProps {
  elements: any[];
  theme: 'dark' | 'light';
}

export default function GraphView({ elements, theme }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || !elements || elements.length === 0) return;

    const labelColor = theme === 'dark' ? '#F8FAFC' : '#0F172A';
    const edgeColor = theme === 'dark' ? '#64748B' : '#94A3B8';

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const nodesOnly = elements.filter((el) => !el.data?.source);
    const edgesOnly = elements.filter((el) => el.data?.source);

    const positionedNodes = nodesOnly.map((el, idx) => {
      if (idx === 0) {
        return { ...el, position: { x: 0, y: 0 } };
      }
      const ringIndex = Math.floor((idx - 1) / 8);
      const posInRing = (idx - 1) % 8;
      const itemsInCurrentRing = Math.min(8, nodesOnly.length - 1 - ringIndex * 8);
      const radius = 130 + ringIndex * 115;
      const angle =
        (2 * Math.PI * posInRing) / Math.max(1, itemsInCurrentRing) + ringIndex * 0.35;

      return {
        ...el,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        },
      };
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...positionedNodes, ...edgesOnly],
      minZoom: 0.25,
      maxZoom: 2.5,
      wheelSensitivity: 0.2,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            color: labelColor,
            'font-size': '10px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 7,
            'text-wrap': 'wrap',
            'text-max-width': '115px',
            width: 36,
            height: 36,
            'border-width': 3.5,
          },
        },
        {
          selector: 'node[type="Repository"]',
          style: {
            'background-color': '#6366F1',
            'border-color': '#C7D2FE',
            width: 48,
            height: 48,
          },
        },
        {
          selector: 'node[type="Commit"]',
          style: {
            'background-color': '#7C3AED',
            'border-color': '#C4B5FD',
            width: 42,
            height: 42,
          },
        },
        {
          selector: 'node[type="PR"]',
          style: {
            'background-color': '#F59E0B',
            'border-color': '#FDE68A',
          },
        },
        {
          selector: 'node[type="Author"]',
          style: {
            'background-color': '#3B82F6',
            'border-color': '#BFDBFE',
          },
        },
        {
          selector: 'node[type="File"]',
          style: {
            'background-color': '#10B981',
            'border-color': '#A7F3D0',
          },
        },
        {
          selector: 'node[type="Feature"]',
          style: {
            'background-color': '#EF4444',
            'border-color': '#FECACA',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': edgeColor,
            'target-arrow-color': edgeColor,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 600,
        fit: true,
        padding: 50,
        randomize: false,
        nodeOverlap: 90,
        idealEdgeLength: () => 145,
        nodeRepulsion: () => 1400000,
        edgeElasticity: () => 110,
        gravity: 0.2,
        numIter: 1200,
      } as any,
    });

    const repelNeighbors = (dragged: cytoscape.NodeSingular) => {
      const pos = dragged.position();
      const minDistance = 95;
      cy.nodes().forEach((other) => {
        if (other.id() !== dragged.id()) {
          const oPos = other.position();
          const dx = oPos.x - pos.x;
          const dy = oPos.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < minDistance) {
            const push = minDistance - dist + 28;
            other.animate({
              position: {
                x: oPos.x + (dx / dist) * push,
                y: oPos.y + (dy / dist) * push,
              },
              duration: 240,
            });
          }
        }
      });
    };

    cy.on('free', 'node', (evt) => repelNeighbors(evt.target));

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements, theme]);

  if (!elements || elements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-xs text-slate-400 dark:text-slate-500 p-6 text-center">
        No graph entities loaded yet. Ingest a repository and ask an architectural question to visualize all commits, files, authors, and PR relationships.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full min-h-[260px]" />;
}