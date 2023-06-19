"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WorkerCreateSchema } from "lib/types/worker";
import { useState } from "react";
import AllergyPill from "../forms/AllergyPill";
import ErrorMessageModal from "../modal/ErrorMessageModal";
import SuccessProceedModal from "../modal/SuccessProceedModal";
import DaysSelection from "../forms/DaysSelection";
import { datesBetween } from "lib/helpers/helpers";
import { useRouter } from "next/navigation";
import { useAPIWorkerCreate } from "lib/fetcher/worker";
import FormWarning from "../forms/FormWarning";
import {allergyMapping} from "../../data/allergyMapping";

const schema = WorkerCreateSchema;
type WorkerForm = z.input<typeof schema>;

interface EditWorkerProps {
  eventStartDate: string;
  eventEndDate: string;
}

export default function CreateWorker({
  eventStartDate,
  eventEndDate,
}: EditWorkerProps) {
  const allDates = datesBetween(
    new Date(eventStartDate),
    new Date(eventEndDate)
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      availability: {
        workDays: [],
        adorationDays: [],
      },
      allergyIds: [],
    },
  });

  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const { trigger, isMutating, reset, error } = useAPIWorkerCreate({
    onSuccess: () => {
      setSaved(true);
    },
  });

  const onSubmit = (data: WorkerForm) => {
    trigger(data);
  };

  const onConfirmationClosed = () => {
    setSaved(false);
    router.back();
  };

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Přidat pracanta</h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="form-label fw-bold mt-4" htmlFor="name">
              Jméno
            </label>
            <input
              id="name"
              className="form-control p-0 fs-5"
              type="text"
              placeholder="Jméno"
              {...register("firstName")}
            />
            <FormWarning
              message={errors.firstName?.message ? "Zadejte jméno" : undefined}
            />
            <label className="form-label fw-bold mt-4" htmlFor="surname">
              Příjmení
            </label>
            <input
              id="surname"
              className="form-control p-0 fs-5"
              type="text"
              placeholder="Příjmení"
              {...register("lastName")}
            />
            <FormWarning
              message={
                errors.lastName?.message ? "Zadejte příjmení" : undefined
              }
            />
            <label className="form-label fw-bold mt-4" htmlFor="phone">
              Telefonní číslo
            </label>
            <input
              id="phone"
              className="form-control p-0 fs-5"
              type="tel"
              maxLength={20}
              pattern="((?:\+|00)[0-9]{1,3})?[ ]?[0-9]{3}[ ]?[0-9]{3}[ ]?[0-9]{3}"
              placeholder="(+420) 123 456 789"
              {...register("phone")}
            />
            <FormWarning
              message={
                errors.phone?.message ? "Zadejte telefonní číslo" : undefined
              }
            />
            <label className="form-label fw-bold mt-4" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              className="form-control p-0 fs-5"
              type="email"
              placeholder="uzivatel@example.cz"
              {...register("email")}
            />
            <FormWarning
              message={errors.email?.message ? "Zadejte e-mail" : undefined}
            />
            <label
              className="form-label d-block fw-bold mt-4"
              htmlFor="availability.workDays"
            >
              Může pracovat v následující dny
            </label>
            <DaysSelection
              name="availability.workDays"
              days={allDates}
              register={() => register("availability.workDays")}
            />
            <label
              className="form-label d-block fw-bold mt-4"
              htmlFor="availability.adorationDays"
            >
              Chce adorovat v následující dny
            </label>
            <DaysSelection
              name="availability.adorationDays"
              days={allDates}
              register={() => register("availability.adorationDays")}
            />
            <label
              className="form-label d-block fw-bold mt-4"
              htmlFor="allergy"
            >
              Alergie
            </label>
            <div className="form-check-inline">
              {Object.entries(allergyMapping).map(([allergyKey, allergyName]) => (
                  <AllergyPill
                      key={allergyKey}
                      allergyId={allergyKey}
                      allergyName={allergyName}
                      register={() => register("allergyIds")}
                  />
              ))}
            </div>
            <label className="form-label d-block fw-bold mt-4">
              Další vlastnosti
            </label>
            <div className="form-check align-self-center align-items-center d-flex gap-2 ms-2">
              <input
                type="checkbox"
                className="fs-5 form-check-input"
                id="strong"
                {...register("strong")}
              />
              <label className="form-check-label" htmlFor="strong">
                Silák
                <i className="fas fa-dumbbell ms-2"></i>
              </label>
            </div>

            <label className="form-label d-block fw-bold mt-4" htmlFor="car">
              Auta
            </label>
            <p>Auta je možné přiřadit v záložce Auta po vytvoření pracanta.</p>

            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary mt-4"
                type="button"
                onClick={() => router.back()}
              >
                Zpět
              </button>
              <input
                type={"submit"}
                className="btn btn-primary mt-4"
                value={"Uložit"}
                disabled={isMutating}
              />
            </div>
            {saved && <SuccessProceedModal onClose={onConfirmationClosed} />}
            {error && <ErrorMessageModal onClose={reset} />}
          </form>
        </div>
      </div>
    </>
  );
}
