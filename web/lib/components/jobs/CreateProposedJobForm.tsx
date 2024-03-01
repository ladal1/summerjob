'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIProposedJobCreate } from 'lib/fetcher/proposed-job'
import { Area, JobType } from 'lib/prisma/client'
import { deserializeAreas } from 'lib/types/area'
import {
  ProposedJobCreateData,
  ProposedJobCreateSchema,
} from 'lib/types/proposed-job'
import { Serialized } from 'lib/types/serialize'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { jobTypeMapping } from '../../data/enumMapping/jobTypeMapping'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { TextInput } from '../forms/input/TextInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { allowForNumber, formatNumber } from 'lib/helpers/helpers'
import { Label } from '../forms/Label'
import FormWarning from '../forms/FormWarning'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { FilterSelectItem } from '../filter-select/FilterSelect'
import { useRouter } from 'next/navigation'
import { DateBool } from 'lib/data/dateSelectionType'
import { ImageUploader } from '../forms/ImageUploader'
import { MapInput } from '../forms/input/MapInput'
import { allergyMapping } from 'lib/data/enumMapping/allergyMapping'
import { GroupButtonsInput } from '../forms/input/GroupButtonsInput'

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
    formState: { errors },
    setValue,
    getValues,
  } = useForm<ProposedJobCreateData>({
    resolver: zodResolver(ProposedJobCreateSchema),
    defaultValues: {
      availability: [],
      allergens: [],
      areaId: undefined,
      jobType: JobType.OTHER,
    },
  })

  const router = useRouter()
  
  const onSubmit = (data: ProposedJobCreateData) => {
    trigger(data, {
      onError: e => {
        console.log(e)
      },
      onSuccess: () => {
        setSaved(true)
      },
    })
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  const selectArea = (id: string) => {
    setValue('areaId', id)
  }
  const selectJobType = (id: string) => {
    setValue('jobType', id as JobType)
  }

  const jobTypeSelectItems = Object.entries(jobTypeMapping).map(
    ([jobTypeKey, jobTypeToSelectName]) => ({
      id: jobTypeKey,
      name: jobTypeToSelectName,
      searchable: jobTypeToSelectName,
    })
  )

  function areaToSelectItem(area: Area): FilterSelectItem {
    return {
      id: area.id,
      searchable: `${area.name}`,
      name: area.name,
    }
  }

  
  //#region Photo

  // Remove newly added photo from FileList before sending
  const removeNewPhoto = (index: number) => {
    const prevPhotoFiles: (FileList | undefined) = getValues('photoFiles')
    // Filter out the file at the specified index
    const filteredFiles: Array<File> = Array.from(prevPhotoFiles ?? []).filter((_, i) => i !== index)
    // Transfer those photos back to photoFiles
    const dt = new DataTransfer()
    filteredFiles.forEach((file: File) => dt.items.add(file))
    setValue('photoFiles', dt.files)
  }

  // Register newly added photo to FileList
  const registerPhoto = (fileList: FileList) => {
    const prevPhotoFiles: (FileList | undefined) = getValues('photoFiles')
    // Combine existing files and newly added files
    const combinedFiles: File[] = (Array.from(prevPhotoFiles ?? [])).concat(Array.from(fileList ?? []))
    // Transfer those photos back to photoFiles
    const dt = new DataTransfer()
    combinedFiles.forEach((file: File) => dt.items.add(file))
    setValue('photoFiles', dt.files)
  }

  //#endregion

  //#region Coordinates and Address

  const registerCoordinates = (coords: [number, number]) => {
    setValue('coordinates', coords)
  }

  const registerAdress = (address: string) => {
    setValue('address', address, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion
  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Přidat job</h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <TextInput
              id="name"
              label="Název jobu"
              placeholder="Název"
              register={() => register("name")}
              errors={errors}
            />
            <TextAreaInput
              id="publicDescription"
              label="Popis navrhované práce"
              placeholder="Popis"
              rows={4}
              register={() => register("publicDescription")}
            />
            <TextAreaInput
              id="privateDescription"
              label="Poznámka pro organizátory"
              placeholder="Poznámka"
              rows={4}
              register={() => register("privateDescription")}
            />
            <FilterSelectInput
              id="areaId"
              label="Oblast jobu"
              placeholder="Vyberte oblast"
              items={areas.map(areaToSelectItem)}
              onSelected={selectArea}
              errors={errors}
              register={() => register('areaId')}
            />
            <MapInput
              address={{
                id: 'address',
                label: 'Adresa',
                placeholder: 'Adresa',
                register: registerAdress,
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
              register={() => register("contact")}
              errors={errors}
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
              label="Celkový počet dní na splnění"
              placeholder="Počet dní"
              type="number"
              min={1}
              defaultValue={1}
              onKeyDown={(e) => allowForNumber(e)}
              register={() => register("requiredDays", {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              errors={errors}
            />
            <Label
              id="minWorkers"
              label="Počet pracantů minimálně / maximálně / z toho silných"
            />
            <div className="d-flex w-50">
              <input
                className="form-control p-1 ps-2"
                id="minWorkers"
                type="number"
                min={1}
                defaultValue={1}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('minWorkers', { valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
              /
              <input
                className="form-control p-1 ps-2"
                id="maxWorkers"
                type="number"
                min={1}
                defaultValue={1}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('maxWorkers', {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
              /
              <input
                className="form-control p-1 ps-2"
                id="strongWorkers"
                type="number"
                min={0}
                defaultValue={0}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('strongWorkers', {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
            </div>
            {(errors.minWorkers ||
              errors.maxWorkers ||
              errors.strongWorkers) && (<FormWarning message={
                errors?.minWorkers?.message as string | undefined ||
                errors?.maxWorkers?.message as string | undefined ||
                errors?.strongWorkers?.message as string | undefined
              } />)}

            <div className="d-flex flex-row">
              <DateSelectionInput
                id="availability"
                label="Časová dostupnost"
                register={() => register("availability")}
                days={allDates}
              />
            </div>
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
              register={() => register('jobType')}
            />
            <GroupButtonsInput
              label="Alergeny"
              mapping={allergyMapping}
              register={() => register("allergens")}
            />
            <OtherAttributesInput
              label="Další vlastnosti"
              register={register}
              objects={[
                {
                  id: "hasFood",
                  icon: "fa fa-utensils",
                  label: "Strava na místě",
                }, 
                {
                  id: "hasShower",
                  icon: "fa fa-shower",
                  label: "Sprcha na místě",
                }
              ]}
            />

            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary mt-4"
                type="button"
                onClick={() => router.back()}
              >
                Zpět
              </button>
              <input
                type={'submit'}
                className="btn btn-primary mt-4"
                value={'Uložit'}
                disabled={isMutating}
              />
            </div>
          </form>
        </div>
      </div>
      {saved && <SuccessProceedModal onClose={onConfirmationClosed} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}
