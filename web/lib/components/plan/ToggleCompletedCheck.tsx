'use client'
import {
  ActiveJobNoPlan,
  ActiveJobUpdateData,
  ActiveJobUpdateSchema,
} from 'lib/types/active-job'
import { useState } from 'react'
import { useAPIActiveJobUpdate } from 'lib/fetcher/active-job'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

interface ToggleCompletedCheckProps {
  job: ActiveJobNoPlan
}

export default function ToggleCompletedCheck({
  job,
}: ToggleCompletedCheckProps) {
  useForm<ActiveJobUpdateData>({
    resolver: zodResolver(ActiveJobUpdateSchema),
    defaultValues: {
      completed: job.completed,
      proposedJob: {
        privateDescription: job.proposedJob.privateDescription,
      },
    },
  })

  const [checked, setChecked] = useState(job.completed)

  const { trigger } = useAPIActiveJobUpdate(job.id, job.planId)
  // Remove confirmation modal: instantly toggle completed and update
  const onChange = () => {
    setChecked(!checked);
    trigger({ completed: !checked });
  };

  return (
    <input
      id="completed"
      className="form-check-input smj-checkbox"
      type="checkbox"
      checked={checked}
      onChange={onChange}
    />
  );
}
