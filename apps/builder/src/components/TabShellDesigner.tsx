'use client';

import { UIDesignerPanel } from './UIDesignerPanel';
import type { FlowDefinition } from '@wms/types';

interface TabShellDesignerProps {
  flow: FlowDefinition;
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

export function TabShellDesigner({ flow, selectedStepId, onSelectStep }: TabShellDesignerProps) {
  return (
    <UIDesignerPanel
      flow={flow}
      selectedStepId={selectedStepId}
      onSelectStep={onSelectStep}
    />
  );
}
