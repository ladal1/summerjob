'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { allergyMapping } from 'lib/data/enumMapping/allergyMapping'
import { mapToolNameToJobType } from 'lib/data/enumMapping/mapToolNameToJobType'
import { toolNameMapping } from 'lib/data/enumMapping/toolNameMapping'
import { useAPIProposedJobUpdate } from 'lib/fetcher/proposed-job'
import { formatNumber, pick, removeRedundantSpace } from 'lib/helpers/helpers'
import {
  deserializeProposedJob,
  ProposedJobUpdateSchema,
} from 'lib/types/proposed-job'
import { Serialized } from 'lib/types/serialize'
import { ToolComplete } from 'lib/types/tool'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { jobTypeMapping } from '../../data/enumMapping/jobTypeMapping'
import { JobType, ToolName } from '../../prisma/client'
import { Area } from '../../prisma/zod'
import { deserializeAreas } from '../../types/area'
import { FilterSelectItem } from '../filter-select/FilterSelect'
import { PillSelectItem } from '../filter-select/PillSelect'
import FormWarning from '../forms/FormWarning'
import { ImageUploader } from '../forms/ImageUploader'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { GroupButtonsInput } from '../forms/input/GroupButtonsInput'
import { MapInput } from '../forms/input/MapInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { PillSelectInput } from '../forms/input/PillSelectInput'
import { ScaleInput } from '../forms/input/ScaleInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { TextInput } from '../forms/input/TextInput'
import { Label } from '../forms/Label'
import { Form } from '../post/Form'

interface EditProposedJobProps {
  serializedJob: Serialized
  serializedAreas: Serialized
  allDates: DateBool[][]
}

const schema = ProposedJobUpdateSchema
type ProposedJobForm = z.input<typeof schema>

export default function EditProposedJobForm({
  serializedJob,
  serializedAreas,
  allDates,
}: EditProposedJobProps) {
  const job = deserializeProposedJob(serializedJob)
  const areas = deserializeAreas(serializedAreas)
  const { trigger, error, isMutating, reset } = useAPIProposedJobUpdate(job.id)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
    getValues,
  } = useForm<ProposedJobForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: job.name,
      publicDescription: job.publicDescription,
      privateDescription: job.privateDescription,
      allergens: job.allergens,
      address: job.address,
      coordinates: job.coordinates,
      contact: job.contact,
      requiredDays: job.requiredDays,
      minWorkers: job.minWorkers,
      maxWorkers: job.maxWorkers,
      strongWorkers: job.strongWorkers,
      hasFood: job.hasFood,
      hasShower: job.hasShower,
      availability: job.availability.map(day => day.toJSON()),
      jobType: job.jobType,
      toolsOnSiteCreate: { tools: job.toolsOnSite },
      toolsToTakeWithCreate: { tools: job.toolsToTakeWith },
      areaId: job.areaId,
      priority: job.priority,
    },
  })

  const router = useRouter()

  const onSubmit = (data: ProposedJobForm) => {
    const modified = pick(data, ...Object.keys(dirtyFields)) as ProposedJobForm
    trigger(modified, {
      onSuccess: () => {
        setSaved(true)
      },
    })
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  //#region JobType

  const selectJobType = (id: string) => {
    setValue('jobType', id as JobType, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const jobTypeSelectItems = Object.entries(jobTypeMapping).map(
    ([jobTypeKey, jobTypeToSelectName]) => ({
      id: jobTypeKey,
      name: jobTypeToSelectName,
      searchable: jobTypeToSelectName,
    })
  )

  const defaultJobType = (): FilterSelectItem | undefined => {
    const typed = jobTypeSelectItems.find(item => item.id === job.jobType)
    if (typed !== undefined) {
      return typed
    } else {
      return jobTypeSelectItems.find(item => item.id === JobType.OTHER)
    }
  }

  //#endregion

  //#region Tools

  const selectToolsOnSite = (items: PillSelectItem[]) => {
    const tools = items.map(item => ({
      id: item.databaseId,
      tool: item.id as ToolName,
      amount: item.amount ?? 1,
    }))
    setValue(
      'toolsOnSiteCreate',
      { tools: tools },
      { shouldDirty: true, shouldValidate: true }
    )
  }

  const selectToolsToTakeWith = (items: PillSelectItem[]) => {
    const tools = items.map(item => ({
      id: item.databaseId,
      tool: item.id as ToolName,
      amount: item.amount ?? 1,
    }))
    setValue(
      'toolsToTakeWithCreate',
      { tools: tools },
      { shouldDirty: true, shouldValidate: true }
    )
  }

  const toolSelectItems = Object.entries(toolNameMapping).map(
    ([key, name]) => ({
      id: key,
      name: name,
      searchable: name,
    })
  )

  const manageToolSelectItems = (): PillSelectItem[][] => {
    const allTools = toolSelectItems
    const currentJobType = getValues('jobType') || JobType.OTHER
    const sortedToolsByCurrentJobType = allTools
      .filter(tool => mapToolNameToJobType(tool.id).includes(currentJobType))
      .sort((a, b) => a.name.localeCompare(b.name))
    const sortedToolsOthers = allTools
      .filter(tool => !sortedToolsByCurrentJobType.some(t => t.id === tool.id))
      .sort((a, b) => a.name.localeCompare(b.name))
    return [sortedToolsByCurrentJobType, sortedToolsOthers]
  }

  const fetchToolSelectItems = (tools: ToolComplete[]): PillSelectItem[] => {
    const selectItems: PillSelectItem[] = tools.map(toolItem => {
      const { id, tool, amount } = toolItem
      return {
        databaseId: id,
        id: tool,
        name: toolNameMapping[tool],
        searchable: toolNameMapping[tool],
        amount,
      }
    })
    return selectItems
  }

  // Remove existing tools from backend.
  const removeExistingToolOnSite = (id: string) => {
    const prevToolIdsDeleted = getValues('toolsOnSiteIdsDeleted') || []
    setValue('toolsOnSiteIdsDeleted', [...prevToolIdsDeleted, id], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const removeExistingToolToTakeWith = (id: string) => {
    const prevToolIdsDeleted = getValues('toolsToTakeWithIdsDeleted') || []
    setValue('toolsToTakeWithIdsDeleted', [...prevToolIdsDeleted, id], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  //#endregion

  //#region Area

  const selectArea = (id: string) => {
    setValue('areaId', id, { shouldDirty: true, shouldValidate: true })
  }

  const areaSelectItems = areas.map(areaToSelectItem)

  function areaToSelectItem(area: Area): FilterSelectItem {
    return {
      id: area.id,
      name: area.name,
      searchable: `${area.name}`,
    }
  }

  //#endregion

  //#region Photo

  // Remove existing photo from backend.
  const removeExistingPhoto = (id: string) => {
    const prevPhotoIdsDeleted = getValues('photoIdsDeleted') || []
    setValue('photoIdsDeleted', [...prevPhotoIdsDeleted, id], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  // Remove newly added photo from FileList before sending
  const removeNewPhoto = (index: number) => {
    const prevPhotoFiles: FileList | undefined = getValues('photoFiles')
    // Filter out the file at the specified index
    const filteredFiles: Array<File> = Array.from(prevPhotoFiles ?? []).filter(
      (_, i) => i !== index
    )
    // Transfer those photos back to photoFiles
    const dt = new DataTransfer()
    filteredFiles.forEach((file: File) => dt.items.add(file))
    setValue('photoFiles', dt.files, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  // Register newly added photo to FileList
  const registerPhoto = (fileList: FileList) => {
    const prevPhotoFiles: FileList | undefined = getValues('photoFiles')
    // Combine existing files and newly added files
    const combinedFiles: File[] = Array.from(prevPhotoFiles ?? []).concat(
      Array.from(fileList ?? [])
    )
    // Transfer those photos back to photoFiles
    const dt = new DataTransfer()
    combinedFiles.forEach((file: File) => dt.items.add(file))
    setValue('photoFiles', dt.files, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const fetchImages = () => {
    return job.photos.map(photo => ({
      url: `/api/proposed-jobs/${job.id}/photos/${photo.id}`,
      index: photo.id,
    }))
  }

  //#endregion

  //#region Coordinates and Address

  const getCoordinates = (): [number, number] | null => {
    if (job.coordinates && job.coordinates[0] && job.coordinates[1]) {
      return [job.coordinates[0], job.coordinates[1]]
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

  return (
    <>
      <Form
        label="Upravit job"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-job"
      >
        <form id="edit-job" onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            id="name"
            label="Název jobu"
            placeholder="Název jobu"
            register={() =>
              register('name', {
                onChange: e =>
                  (e.target.value = removeRedundantSpace(e.target.value)),
              })
            }
            errors={errors}
          />
          <TextAreaInput
            id="publicDescription"
            label="Popis navrhované práce"
            placeholder="Popis"
            rows={4}
            register={() => register('publicDescription')}
            errors={errors}
          />
          <TextAreaInput
            id="privateDescription"
            label="Poznámka pro organizátory"
            placeholder="Poznámka"
            rows={4}
            register={() => register('privateDescription')}
            errors={errors}
          />
          <FilterSelectInput
            id="areaId"
            label="Oblast jobu"
            placeholder={job.area?.name ?? 'Vyberte oblast'}
            items={areaSelectItems}
            onSelected={selectArea}
            defaultSelected={areaSelectItems.find(
              item => item.id === job.areaId
            )}
            errors={errors}
          />
          <MapInput
            address={{
              id: 'address',
              label: 'Adresa',
              placeholder: 'Adresa',
              init: job.address,
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
            id="photoFiles"
            label="Fotografie"
            secondaryLabel="Maximálně 10 souborů, každý o maximální velikosti 10 MB."
            photoInit={fetchImages()}
            errors={errors}
            registerPhoto={registerPhoto}
            removeNewPhoto={removeNewPhoto}
            removeExistingPhoto={removeExistingPhoto}
            multiple
            maxPhotos={10}
          />
          <TextInput
            id="contact"
            label="Kontakt"
            placeholder="Kontakt"
            register={() => register('contact')}
            errors={errors}
          />
          <TextInput
            id="requiredDays"
            type="number"
            label="Celkový počet dní na splnění"
            placeholder="Počet dní"
            min={1}
            defaultValue={1}
            register={() =>
              register('requiredDays', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })
            }
            errors={errors}
          />
          <Label
            id="minWorkers"
            label="Počet pracantů minimálně / maximálně / z toho silných"
          />
          <div className="d-flex w-50">
            <input
              className="form-control smj-input p-1 ps-2 fs-5"
              id="minWorkers"
              type="number"
              min={1}
              defaultValue={1}
              {...register('minWorkers', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })}
            />
            /
            <input
              className="form-control smj-input p-1 ps-2 fs-5"
              id="maxWorkers"
              type="number"
              min={1}
              defaultValue={1}
              {...register('maxWorkers', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })}
            />
            /
            <input
              className="form-control smj-input p-1 ps-2 fs-5"
              id="strongWorkers"
              type="number"
              min={0}
              defaultValue={0}
              {...register('strongWorkers', {
                valueAsNumber: true,
                onChange: e => (e.target.value = formatNumber(e.target.value)),
              })}
            />
          </div>
          {(errors.minWorkers || errors.maxWorkers || errors.strongWorkers) && (
            <FormWarning
              message={
                (errors?.minWorkers?.message as string | undefined) ||
                (errors?.maxWorkers?.message as string | undefined) ||
                (errors?.strongWorkers?.message as string | undefined)
              }
            />
          )}

          <div className="d-flex flex-row">
            <DateSelectionInput
              id="availability"
              label="Časová dostupnost"
              register={() => register('availability')}
              days={allDates}
            />
          </div>
          <FilterSelectInput
            id="jobType"
            label="Typ práce"
            placeholder={jobTypeMapping[job.jobType] ?? 'Vyberte typ práce'}
            items={jobTypeSelectItems}
            onSelected={selectJobType}
            defaultSelected={defaultJobType()}
            errors={errors}
          />
          <PillSelectInput
            id="toolsOnSiteCreate"
            label="Nářadí na místě"
            placeholder={'Vyberte nástroje'}
            items={manageToolSelectItems()}
            init={fetchToolSelectItems(job.toolsOnSite)}
            removeExisting={removeExistingToolOnSite}
            withNumberSelect={true}
            register={selectToolsOnSite}
            errors={errors}
          />
          <PillSelectInput
            id="toolsToTakeWithCreate"
            label="Nářadí s sebou"
            placeholder={'Vyberte nástroje'}
            items={manageToolSelectItems()}
            init={fetchToolSelectItems(job.toolsToTakeWith)}
            removeExisting={removeExistingToolToTakeWith}
            withNumberSelect={true}
            register={selectToolsToTakeWith}
            errors={errors}
          />
          <GroupButtonsInput
            id="allergens"
            label="Alergeny"
            mapping={allergyMapping}
            register={() => register('allergens')}
          />
          <OtherAttributesInput
            label="Další vlastnosti"
            register={register}
            objects={[
              {
                id: 'hasFood',
                icon: 'fa fa-utensils',
                label: 'Strava na místě',
              },
              {
                id: 'hasShower',
                icon: 'fa fa-shower',
                label: 'Sprcha na místě',
              },
            ]}
          />
          <ScaleInput
            id="priority"
            label="Priorita jobu"
            secondaryLabel="1 značí nejmenší a 5 největší"
            min={1}
            max={5}
            register={() => register('priority', { valueAsNumber: true })}
            errors={errors}
          />
        </form>
      </Form>
    </>
  )
}
