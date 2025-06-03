import { useState, useMemo } from 'react'
import { useAPIWorkers } from 'lib/fetcher/worker'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { Label } from '../forms/Label'
import { FilterSelectItem } from '../filter-select/FilterSelect'

interface ParticipantManagementProps {
  enrolledParticipants: Array<{
    workerId: string
    worker: { firstName: string; lastName: string }
  }>
  onParticipantsChange: (addIds: string[], removeIds: string[]) => void
}

export function ParticipantManagement({
  enrolledParticipants,
  onParticipantsChange,
}: ParticipantManagementProps) {
  const { data: workers } = useAPIWorkers()
  const [selectedParticipantsToAdd, setSelectedParticipantsToAdd] = useState<
    string[]
  >([])
  const [selectedParticipantsToRemove, setSelectedParticipantsToRemove] =
    useState<string[]>([])

  // Create participant items for FilterSelect (available to add)
  const availableParticipantItems: FilterSelectItem[] = useMemo(() => {
    if (!workers) return []

    // Filter out participants already enrolled in the post
    const enrolledParticipantIds = new Set(
      enrolledParticipants.map(p => p.workerId)
    )

    return workers
      .filter(worker => !enrolledParticipantIds.has(worker.id))
      .map(worker => ({
        id: worker.id,
        searchable: `${worker.firstName} ${worker.lastName}`,
        name: `${worker.firstName} ${worker.lastName}`,
      }))
  }, [workers, enrolledParticipants])

  // Create enrolled participant items for removal
  const enrolledParticipantItems: FilterSelectItem[] = useMemo(() => {
    return enrolledParticipants.map(participant => ({
      id: participant.workerId,
      searchable: `${participant.worker.firstName} ${participant.worker.lastName}`,
      name: `${participant.worker.firstName} ${participant.worker.lastName}`,
    }))
  }, [enrolledParticipants])

  const handleAddParticipant = (participantId: string) => {
    if (!selectedParticipantsToAdd.includes(participantId)) {
      const newAddList = [...selectedParticipantsToAdd, participantId]
      setSelectedParticipantsToAdd(newAddList)
      onParticipantsChange(newAddList, selectedParticipantsToRemove)
    }
  }

  const handleRemoveParticipant = (participantId: string) => {
    if (!selectedParticipantsToRemove.includes(participantId)) {
      const newRemoveList = [...selectedParticipantsToRemove, participantId]
      setSelectedParticipantsToRemove(newRemoveList)
      onParticipantsChange(selectedParticipantsToAdd, newRemoveList)
    }
  }

  const removeFromAddList = (participantId: string) => {
    const newAddList = selectedParticipantsToAdd.filter(
      id => id !== participantId
    )
    setSelectedParticipantsToAdd(newAddList)
    onParticipantsChange(newAddList, selectedParticipantsToRemove)
  }

  const removeFromRemoveList = (participantId: string) => {
    const newRemoveList = selectedParticipantsToRemove.filter(
      id => id !== participantId
    )
    setSelectedParticipantsToRemove(newRemoveList)
    onParticipantsChange(selectedParticipantsToAdd, newRemoveList)
  }

  return (
    <div className="mt-3">
      <Label id="participant-management" label="Správa účastníků" />

      {/* Add Participants */}
      {availableParticipantItems.length > 0 && (
        <div className="mb-3">
          <FilterSelectInput
            id="add-participant"
            label="Přidat účastníka"
            placeholder="Vyberte účastníka pro přidání"
            items={availableParticipantItems.filter(
              item => !selectedParticipantsToAdd.includes(item.id)
            )}
            onSelected={handleAddParticipant}
            errors={{}}
          />
          {selectedParticipantsToAdd.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">Účastníci k přidání:</small>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {selectedParticipantsToAdd.map(participantId => {
                  const worker = workers?.find(w => w.id === participantId)
                  return worker ? (
                    <span key={participantId} className="badge bg-success">
                      {worker.firstName} {worker.lastName}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.7em' }}
                        onClick={() => removeFromAddList(participantId)}
                      />
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remove Participants */}
      {enrolledParticipantItems.length > 0 && (
        <div className="mb-3">
          <FilterSelectInput
            id="remove-participant"
            label="Odstranit účastníka"
            placeholder="Vyberte účastníka pro odstranění"
            items={enrolledParticipantItems.filter(
              item => !selectedParticipantsToRemove.includes(item.id)
            )}
            onSelected={handleRemoveParticipant}
            errors={{}}
          />
          {selectedParticipantsToRemove.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">Účastníci k odstranění:</small>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {selectedParticipantsToRemove.map(participantId => {
                  const participant = enrolledParticipants.find(
                    p => p.workerId === participantId
                  )
                  return participant ? (
                    <span key={participantId} className="badge bg-danger">
                      {participant.worker.firstName}{' '}
                      {participant.worker.lastName}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.7em' }}
                        onClick={() => removeFromRemoveList(participantId)}
                      />
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
