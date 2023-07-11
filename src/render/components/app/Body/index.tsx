import flux from '@aust/react-flux';
import { useEffect } from 'react';

import Column from './Column';
import StatusIndicator from './StatusIndicator';
import StepViewer from './StepViewer';
import { Step } from '@/render/flux/wizardStore';

export default function Body() {
  const error = flux.wizard.useState('error');
  const step = flux.wizard.selectState('currentStep');
  const stepStatus = flux.wizard.selectState('stepStatus');

  // when the component first loads, start going through the steps
  useEffect(() => void flux.dispatch('wizard/checkDocker'), []);

  return (
    <div className="flex gap-6 grow p-6">
      <Column className="w-1/3">
        <div className="font-light mb-6 text-xl">Node Overview</div>
        <StatusIndicator
          active={step === Step.Docker_Installed}
          label="Docker Installed"
          status={stepStatus[Step.Docker_Installed]}
        />
        <StatusIndicator
          active={step === Step.Container_Built}
          className="mt-2"
          label="Container Built"
          status={stepStatus[Step.Container_Built]}
        />
        <StatusIndicator
          active={step === Step.Container_Running}
          className="mt-2"
          label="Container Running"
          status={stepStatus[Step.Container_Running]}
        />
        <StatusIndicator
          active={step === Step.Node_Running}
          className="mt-2"
          label="Node Running"
          status={stepStatus[Step.Node_Running]}
        />
        <StatusIndicator
          active={step === Step.Node_Synced}
          className="mt-2"
          label="Node Synced"
          status={stepStatus[Step.Node_Synced]}
        />
        <StatusIndicator
          active={step === Step.Participating}
          className="mt-2"
          label="Participating in Consensus"
          status={stepStatus[Step.Participating]}
        />
      </Column>
      <StepViewer
        className="grow"
        error={error}
        status={stepStatus[step]}
        step={step}
      />
    </div>
  );
}
