'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { LabelWithIcon } from 'lib/data/enumMapping/enumMapping'
import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { useAPIPostUpdate } from 'lib/fetcher/post'
import { pick, removeRedundantSpace, formatNumber } from 'lib/helpers/helpers'
import { deserializePost, PostUpdateSchema } from 'lib/types/post'
import { Serialized } from 'lib/types/serialize'
import { PostTag } from 'lib/types/enums'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm, FieldErrors } from 'react-hook-form'
import { z } from 'zod'
import { PillSelectItem } from '../filter-select/PillSelect'
import { FilterSelectItem } from '../filter-select/FilterSelect'
import { Form } from '../forms/Form'
import { ImageUploader } from '../forms/ImageUploader'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { MapInput } from '../forms/input/MapInput'
import { MarkdownEditor } from '../forms/input/MarkdownEditor'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { PillSelectInput } from '../forms/input/PillSelectInput'
import { TextInput } from '../forms/input/TextInput'
import { TimeInput } from '../forms/input/TimeInput'
import { Label } from '../forms/Label'
import { useAPIWorkers } from 'lib/fetcher/worker'

const schema = PostUpdateSchema
type PostForm = z.input<typeof schema>

interface EditPostProps {
  serializedPost: Serialized
  allDates: DateBool[][]
}
export default function EditPost({ serializedPost, allDates }: EditPostProps) {
  const post = deserializePost(serializedPost)
  const { data: workers } = useAPIWorkers()
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<PostForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: post.name,
      availability: post.availability.map(day => day.toJSON()),
      timeFrom: post.timeFrom,
      timeTo: post.timeTo,
      address: post.address,
      coordinates: post.coordinates,
      shortDescription: post.shortDescription,
      longDescription: post.longDescription,
      tags: post.tags,
      isMandatory: post.isMandatory,
      isOpenForParticipants: post.isOpenForParticipants,
      maxParticipants: post.maxParticipants,
    },
  })

  const router = useRouter()

  // Watch fields to conditionally show/disable maxParticipants
  const isMandatory = watch('isMandatory')
  const isOpenForParticipants = watch('isOpenForParticipants')

  // Clear maxParticipants when it shouldn't be available
  useEffect(() => {
    if (isMandatory || !isOpenForParticipants) {
      setValue('maxParticipants', null, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [isMandatory, isOpenForParticipants, setValue])

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, reset, error } = useAPIPostUpdate(post.id, {
    onSuccess: () => {
      setSaved(true)
      reset()
      router.refresh()
    },
  })

  //#region Participant Management
  const [participantChanges, setParticipantChanges] = useState<{
    addParticipantIds: string[]
    removeParticipantIds: string[]
  }>({
    addParticipantIds: [],
    removeParticipantIds: [],
  })

  // Helper functions for participant management
  const addParticipant = (participantId: string) => {
    if (!participantChanges.addParticipantIds.includes(participantId)) {
      const newAddList = [
        ...participantChanges.addParticipantIds,
        participantId,
      ]
      const newRemoveList = participantChanges.removeParticipantIds.filter(
        id => id !== participantId
      )
      setParticipantChanges({
        addParticipantIds: newAddList,
        removeParticipantIds: newRemoveList,
      })
    }
  }

  const removeParticipant = (participantId: string) => {
    const isCurrentlyEnrolled = post.participants.some(
      p => p.workerId === participantId
    )
    const isToBeAdded =
      participantChanges.addParticipantIds.includes(participantId)
    const isMarkedForRemoval =
      participantChanges.removeParticipantIds.includes(participantId)

    if (isToBeAdded) {
      // If participant was to be added, just remove from add list
      setParticipantChanges({
        ...participantChanges,
        addParticipantIds: participantChanges.addParticipantIds.filter(
          id => id !== participantId
        ),
      })
    } else if (isCurrentlyEnrolled) {
      if (isMarkedForRemoval) {
        // Undo removal - remove from remove list
        setParticipantChanges({
          ...participantChanges,
          removeParticipantIds: participantChanges.removeParticipantIds.filter(
            id => id !== participantId
          ),
        })
      } else {
        // Mark for removal
        setParticipantChanges({
          ...participantChanges,
          removeParticipantIds: [
            ...participantChanges.removeParticipantIds,
            participantId,
          ],
        })
      }
    }
  }

  // Check if there are any participant changes
  const hasParticipantChanges = () => {
    return (
      participantChanges.addParticipantIds.length > 0 ||
      participantChanges.removeParticipantIds.length > 0
    )
  }

  // Get available participants for adding (not enrolled and not already being added)
  const getAvailableParticipants = (): FilterSelectItem[] => {
    if (!workers) return []

    const enrolledParticipantIds = new Set(
      post.participants.map(p => p.workerId)
    )
    const toBeAddedIds = new Set(participantChanges.addParticipantIds)

    return workers
      .filter(
        worker =>
          !enrolledParticipantIds.has(worker.id) && !toBeAddedIds.has(worker.id)
      )
      .map(worker => ({
        id: worker.id,
        searchable: `${worker.firstName} ${worker.lastName}`,
        name: `${worker.firstName} ${worker.lastName}`,
      }))
  }
  //#endregion

  const onSubmit = (dataForm: PostForm) => {
    const modified = pick(
      dataForm,
      ...Object.keys(dirtyFields)
    ) as unknown as PostForm

    // Add participant management data if there are any changes
    if (
      participantChanges.addParticipantIds.length > 0 ||
      participantChanges.removeParticipantIds.length > 0
    ) {
      modified.participantManagement = {
        addParticipantIds:
          participantChanges.addParticipantIds.length > 0
            ? participantChanges.addParticipantIds
            : undefined,
        removeParticipantIds:
          participantChanges.removeParticipantIds.length > 0
            ? participantChanges.removeParticipantIds
            : undefined,
      }
    }

    trigger(modified)
    // Reset participant changes after submission
    setParticipantChanges({ addParticipantIds: [], removeParticipantIds: [] })
  }

  //#region Coordinates and Address

  const getCoordinates = (): [number, number] | null => {
    if (post.coordinates && post.coordinates[0] && post.coordinates[1]) {
      return [post.coordinates[0], post.coordinates[1]]
    }
    return null
  }

  const registerCoordinates = (coords: [number, number]) => {
    setValue('coordinates', coords, { shouldDirty: true, shouldValidate: true })
  }

  const registerAdress = (address: string) => {
    setValue('address', address, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  //#region Photo

  const removeNewPhoto = () => {
    setValue('photoFile', null, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const removeExistingPhoto = () => {
    setValue('photoFileRemoved', true, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const registerPhoto = (fileList: FileList) => {
    setValue('photoFile', fileList, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  //#region Tags

  const tagSelectItems: PillSelectItem[] = Object.entries(
    postTagMappingWithIcon
  ).map(([key, content]) => ({
    id: key,
    name: (content as LabelWithIcon).name,
    searchable: (content as LabelWithIcon).name,
    icon: (content as LabelWithIcon).icon,
  }))

  const manageTagSelectItems = (): PillSelectItem[][] => {
    const allTags = tagSelectItems
    return [allTags]
  }

  const fetchTagSelectItems = (tags: PostTag[]): PillSelectItem[] => {
    const selectItems: PillSelectItem[] = tags.map(tagItem => {
      return {
        id: tagItem,
        name: postTagMappingWithIcon[tagItem].name,
        searchable: postTagMappingWithIcon[tagItem].name,
        icon: postTagMappingWithIcon[tagItem].icon,
      }
    })
    return selectItems
  }

  const removeExistingTag = (id: string) => {
    const prevTags = getValues('tags') || []
    const newTags = prevTags.filter(item => item !== (id as PostTag))
    setValue('tags', newTags, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const selectTags = (items: PillSelectItem[]) => {
    const tags = items.map(item => item.id as PostTag)
    setValue('tags', tags, { shouldDirty: true, shouldValidate: true })
  }
  //#endregion

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <Form
      label="Upravit příspěvek"
      isInputDisabled={isMutating}
      onConfirmationClosed={onConfirmationClosed}
      resetForm={reset}
      saved={saved}
      error={error}
      formId="edit-post"
      isDirty={
        !saved &&
        (Object.keys(dirtyFields).length > 0 || hasParticipantChanges())
      }
    >
      <form id="edit-post" onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          id="name"
          label="Název"
          placeholder="Název"
          register={() =>
            register('name', {
              onChange: e => {
                e.target.value = removeRedundantSpace(e.target.value)
              },
            })
          }
          errors={errors}
          mandatory
          margin={false}
        />
        <MarkdownEditor
          id="shortDescription"
          label="Krátký popis"
          placeholder="Popis příspěvku... (podporuje Markdown formátování)"
          rows={3}
          register={() => register('shortDescription')}
          errors={errors as FieldErrors<Record<string, unknown>>}
          mandatory
        />
        <MarkdownEditor
          id="longDescription"
          label="Dlouhý popis"
          placeholder="Detailní popis příspěvku... (podporuje Markdown formátování)"
          rows={6}
          register={() => register('longDescription')}
          errors={errors as FieldErrors<Record<string, unknown>>}
        />
        <div className="d-flex flex-row">
          <DateSelectionInput
            id="availability"
            label="Platné pro dny"
            register={() => register('availability')}
            days={allDates}
          />
        </div>
        <TimeInput
          label="Čas"
          register={register}
          errors={errors}
          setValue={setValue}
          timeFromId="timeFrom"
          timeToId="timeTo"
        />
        <MapInput
          address={{
            id: 'address',
            label: 'Adresa',
            placeholder: 'Adresa',
            init: post.address ?? '',
            register: registerAdress,
          }}
          coordinates={{
            id: 'coordinates',
            label: 'Souřadnice',
            placeholder: '0, 0',
            init: getCoordinates(),
            register: registerCoordinates,
          }}
          errors={errors}
        />
        <ImageUploader
          id="photoFile"
          label="Fotografie"
          secondaryLabel="Maximálně 1 soubor o maximální velikosti 10 MB."
          photoInit={
            post.photoPath
              ? [{ url: `/api/posts/${post.id}/photo`, index: '0' }]
              : null
          }
          errors={errors}
          registerPhoto={registerPhoto}
          removeNewPhoto={removeNewPhoto}
          removeExistingPhoto={removeExistingPhoto}
        />
        <PillSelectInput
          id="tags"
          label="Tagy"
          placeholder={'Vyberte tagy'}
          items={manageTagSelectItems()}
          init={fetchTagSelectItems(post.tags)}
          removeExisting={removeExistingTag}
          register={selectTags}
          errors={errors}
        />
        {isOpenForParticipants && !isMandatory && (
          <>
            <TextInput
              id="maxParticipants"
              type="number"
              label="Maximální počet účastníků"
              placeholder="Maximální počet účastníků"
              min={1}
              register={() =>
                register('maxParticipants', {
                  valueAsNumber: true,
                  onChange: e =>
                    (e.target.value = formatNumber(e.target.value)),
                })
              }
              errors={errors}
            />
          </>
        )}
        <OtherAttributesInput
          label="Další vlastnosti"
          register={register}
          objects={[
            {
              id: 'isMandatory',
              icon: 'fas fa-people-pulling',
              label: 'Povinná účast pro všechny',
            },
            {
              id: 'isOpenForParticipants',
              icon: 'fas fa-door-open',
              label: 'Otevřeno pro zapsání účastníky',
            },
          ]}
        />{' '}
        <Label id={'participants'} label="Zapsaní účastníci" />
        {/* Add new participants */}
        <div className="mb-3">
          <FilterSelectInput
            id="add-participants"
            label="Přidat účastníky"
            placeholder="Vybrat účastníky..."
            onSelected={(participantId: string) =>
              addParticipant(participantId)
            }
            items={getAvailableParticipants()}
            errors={{}}
            preserveSearchOnSelect={true}
          />
        </div>
        {/* Current participants list with remove buttons */}
        <div>
          {post.maxParticipants && (
            <div className="text-muted fs-7 mb-2">
              Počet účastníků:{' '}
              {post.participants.length +
                participantChanges.addParticipantIds.length -
                participantChanges.removeParticipantIds.length}{' '}
              / {post.maxParticipants}
              {post.participants.length +
                participantChanges.addParticipantIds.length -
                participantChanges.removeParticipantIds.length >=
                post.maxParticipants && (
                <span className="text-warning ms-2">• Plná kapacita</span>
              )}
            </div>
          )}

          {/* Multi-column participant list */}
          <div className="row g-2">
            {/* Current enrolled participants */}
            {post.participants
              .sort((a, b) =>
                a.worker.lastName.localeCompare(b.worker.lastName)
              )
              .map(participant => {
                const isMarkedForRemoval =
                  participantChanges.removeParticipantIds.includes(
                    participant.workerId
                  )
                return (
                  <div
                    key={participant.workerId}
                    className="col-12 col-md-6 col-lg-4"
                  >
                    <div
                      className={`d-flex justify-content-between align-items-center p-2 border rounded ${isMarkedForRemoval ? 'bg-light' : 'bg-white'}`}
                    >
                      <span className="flex-grow-1 me-2 d-flex justify-content-between align-items-center">
                        <span
                          className={`${isMarkedForRemoval ? 'text-decoration-line-through text-muted' : ''}`}
                        >
                          <small>
                            {participant.worker.firstName}{' '}
                            {participant.worker.lastName}
                          </small>
                        </span>
                        {isMarkedForRemoval && (
                          <small className="text-danger ms-2">
                            (bude odebrán)
                          </small>
                        )}
                      </span>
                      <button
                        type="button"
                        className={`btn btn-sm ${isMarkedForRemoval ? 'btn-secondary' : 'btn-outline-danger'}`}
                        onClick={() => removeParticipant(participant.workerId)}
                        title={
                          isMarkedForRemoval
                            ? 'Zrušit odebrání'
                            : 'Odebrat účastníka'
                        }
                        style={{ minWidth: '32px' }}
                      >
                        <i
                          className={`fas ${isMarkedForRemoval ? 'fa-undo' : 'fa-times'}`}
                        ></i>
                      </button>
                    </div>
                  </div>
                )
              })}

            {/* Participants to be added */}
            {participantChanges.addParticipantIds.map(participantId => {
              const worker = workers?.find(w => w.id === participantId)
              if (!worker) return null
              return (
                <div key={participantId} className="col-12 col-md-6 col-lg-4">
                  <div className="d-flex justify-content-between align-items-center p-2 border rounded bg-success-subtle">
                    <span className="flex-grow-1 me-2 d-flex justify-content-between align-items-center">
                      <span className="text-success">
                        <small>
                          {worker.firstName} {worker.lastName}
                        </small>
                      </span>
                      <small className="text-success ms-2">(bude přidán)</small>
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => removeParticipant(participantId)}
                      title="Zrušit přidání"
                      style={{ minWidth: '32px' }}
                    >
                      <i className="fas fa-undo"></i>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {post.participants.length === 0 &&
            participantChanges.addParticipantIds.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted mb-0">Zatím žádní zapsaní účastníci</p>
              </div>
            )}
        </div>
      </form>
    </Form>
  )
}
