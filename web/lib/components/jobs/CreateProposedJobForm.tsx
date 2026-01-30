'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { workAllergyMapping } from 'lib/data/enumMapping/workAllergyMapping'
import { mapToolNameToJobType } from 'lib/data/enumMapping/mapToolNameToJobType'
import { toolNameMapping } from 'lib/data/enumMapping/toolNameMapping'
import { useAPIProposedJobCreate } from 'lib/fetcher/proposed-job'
import { formatNumber, removeRedundantSpace } from 'lib/helpers/helpers'
import { JobType, ToolName } from 'lib/types/enums'
import { deserializeAreas } from 'lib/types/area'
import {
  ProposedJobCreateData,
  ProposedJobCreateSchema,
} from 'lib/types/proposed-job'
import { Serialized } from 'lib/types/serialize'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, FieldErrors } from 'react-hook-form'
import { jobTypeMapping } from '../../data/enumMapping/jobTypeMapping'
import { FilterSelectItem } from '../filter-select/FilterSelect'
import { PillSelectItem } from '../filter-select/PillSelect'
import FormWarning from '../forms/FormWarning'
import { ImageUploader } from '../forms/ImageUploader'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { GroupButtonsInput } from '../forms/input/GroupButtonsInput'
import { MapInput } from '../forms/input/MapInput'
import { MarkdownEditor } from '../forms/input/MarkdownEditor'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { PillSelectInput } from '../forms/input/PillSelectInput'
import { TextInput } from '../forms/input/TextInput'
import { Label } from '../forms/Label'
import { Form } from '../forms/Form'
import { z } from 'zod'
import { ScaleInput } from '../forms/input/ScaleInput'

const schema = ProposedJobCreateSchema
type PostForm = z.input<typeof schema>

interface CreateProposedJobProps {
  serializedAreas: Serialized
  allDates: DateBool[][]
}

export default function CreateProposedJobForm({
  serializedAreas,
  allDates,
}: CreateProposedJobProps) {
  const areas = deserializeAreas(serializedAreas)
  const { trigger, error, isMutating, reset } = useAPIProposedJobCreate()
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
    getValues,
  } = useForm<PostForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      availability: [],
      allergens: [],
      areaId: undefined,
      jobType: JobType.OTHER,
    },
  })

  const router = useRouter()

  const onSubmit = (data: PostForm) => {
    trigger(data as ProposedJobCreateData, {
      onError: e => {
        console.log(e)
      },
      onSuccess: () => {
        setSaved(true)
        reset()
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

  //#endregion

  //#region Tools

  const selectToolsOnSite = (items: PillSelectItem[]) => {
    const tools = items.map(item => ({
      id: item.databaseId,
      tool: item.id as ToolName,
      amount: item.amount ?? 1,
    }))
    setValue(
      'toolsOnSite',
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
      'toolsToTakeWith',
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

  //#endregion

  //#region Area

  const selectArea = (id: string) => {
    setValue('areaId', id, { shouldDirty: true, shouldValidate: true })
  }

  function areaToSelectItem(
    area: ReturnType<typeof deserializeAreas>[number]
  ): FilterSelectItem {
    return {
      id: area.id,
      searchable: `${area.name}`,
      name: area.name,
    }
  }
  //#endregion

  //#region Photo

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

  //#endregion

  //#region Coordinates and Address

  const registerCoordinates = (coords: [number, number]) => {
    setValue('coordinates', coords, { shouldDirty: true, shouldValidate: true })
  }

  const registerAdress = (address: string) => {
    setValue('address', address, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  //#region Priority

  const registerPriority = (num: number) => {
    setValue('priority', num, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  return (
    <>
      <Form
        label="Vytvořit job"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-job"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="create-job"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TextInput
            id="name"
            label="Název jobu"
            placeholder="Název"
            register={() =>
              register('name', {
                onChange: e =>
                  (e.target.value = removeRedundantSpace(e.target.value)),
              })
            }
            errors={errors}
            mandatory
            margin={false}
          />
          <MarkdownEditor
            id="publicDescription"
            label="Popis navrhované práce"
            placeholder="Popis navrhované práce... (podporuje Markdown formátování)"
            rows={4}
            register={() => register('publicDescription')}
            errors={errors as FieldErrors<Record<string, unknown>>}
          />
          <MarkdownEditor
            id="privateDescription"
            label="Poznámka pro organizátory"
            placeholder="Poznámka pro organizátory... (podporuje Markdown formátování)"
            rows={4}
            register={() => register('privateDescription')}
            errors={errors as FieldErrors<Record<string, unknown>>}
          />
          <FilterSelectInput
            id="areaId"
            label="Oblast jobu"
            placeholder="Vyberte oblast"
            items={areas.map(areaToSelectItem)}
            onSelected={selectArea}
            errors={errors}
            mandatory
          />
          <MapInput
            address={{
              id: 'address',
              label: 'Adresa',
              placeholder: 'Adresa',
              register: registerAdress,
              mandatory: true,
            }}
            coordinates={{
              id: 'coordinates',
              label: 'Souřadnice',
              placeholder: '0, 0',
              register: registerCoordinates,
            }}
            errors={errors}
          />
          <TextInput
            id="contact"
            label="Kontakt"
            placeholder="Kontakt"
            register={() => register('contact')}
            errors={errors}
            mandatory
          />
          <ImageUploader
            id="photoFiles"
            label="Fotografie"
            secondaryLabel="Maximálně 10 souborů, každý o maximální velikosti 10 MB."
            errors={errors}
            registerPhoto={registerPhoto}
            removeNewPhoto={removeNewPhoto}
            multiple
            maxPhotos={10}
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
            mandatory
          />
          <Label
            id="minWorkers"
            label="Počet pracantů minimálně / maximálně / z toho silných"
            mandatory
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
          <FormWarning
            message={errors?.availability?.message as string | undefined}
          />
          <FilterSelectInput
            id="jobType"
            label="Typ práce"
            placeholder="Vyberte typ práce"
            items={jobTypeSelectItems}
            onSelected={selectJobType}
            defaultSelected={jobTypeSelectItems.find(
              item => item.id === JobType.OTHER
            )}
            errors={errors}
          />
          <PillSelectInput
            id="toolsOnSite"
            label="Nářadí na místě"
            placeholder={'Vyberte nástroje'}
            items={manageToolSelectItems()}
            withNumberSelect={true}
            register={selectToolsOnSite}
            errors={errors}
          />
          <PillSelectInput
            id="toolsToTakeWith"
            label="Nářadí s sebou"
            placeholder={'Vyberte nástroje'}
            items={manageToolSelectItems()}
            withNumberSelect={true}
            register={selectToolsToTakeWith}
            errors={errors}
          />
          <GroupButtonsInput
            id="allergens"
            label="Pracovní alergie"
            mapping={workAllergyMapping}
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
            min={1}
            max={5}
            registerPriority={registerPriority}
            errors={errors}
          />
        </form>
      </Form>
    </>
  )
}
