import { FieldErrors, UseFormRegister } from 'react-hook-form'
import { NoteInput } from '../forms/input/TextAreaInput'
import { TextInput } from '../forms/input/TextInput'
import { Modal, ModalSize } from './Modal'
import { CarCreateData } from 'lib/types/car'

// TODO: Finish AddCarModal or remove

type AddCarModalProps = {
  onClose: () => void
  register: UseFormRegister<CarCreateData>
  errors: FieldErrors<CarCreateData>
}

export default function AddCarModal({
  onClose,
  errors,
  register,
}: AddCarModalProps) {
  const crymeriver = () => {
    return true
  }
  return (
    <Modal title="Přidat auto" size={ModalSize.LARGE} onClose={onClose}>
      <div className="mb-4">
        <form onSubmit={crymeriver} autoComplete="off">
          <TextInput
            id="name"
            label="Název"
            placeholder="Model auta, značka"
            errors={errors}
            register={() => register("name")}
            margin={false}
          />
          <NoteInput
            id="description"
            label="Poznámka pro organizátory"
            placeholder="Speciální vlastnosti, způsob kompenzace za najeté km, ..."
            rows={3}
            register={() => register("description")}
          />
          <TextInput
            id="seats"
            label="Počet sedadel"
            type="number"
            placeholder="Počet sedadel"
            min={1}
            errors={errors}
            register={() => register("seats", { valueAsNumber: true })}
          />
          <TextInput
            id="odometerStart"
            label="Počáteční stav kilometrů"
            type="number"
            placeholder="Počáteční stav kilometrů"
            min={0}
            errors={errors}
            register={() => register("odometerStart", { valueAsNumber: true })}
          />
        </form>
      </div>
      <button
        className="btn pt-2 pb-2 btn-primary float-end"
        onClick={() => onClose()}
      >
        Pokračovat
      </button>
    </Modal>
  )
}
