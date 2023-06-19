import { UseFormRegisterReturn } from "react-hook-form";

export default function AllergyPill({
  allergyId,
  allergyName,
  register,
}: {
  allergyId: string;
  allergyName: string;
  register: () => UseFormRegisterReturn;
}) {
  return (
    <div className="d-inline-block me-3">
      <input
        id={allergyId}
        className="btn-check"
        type="checkbox"
        value={allergyId}
        {...register()}
      />
      <label
        className="form-label btn-light btn p-2 allergy-checkbox-label"
        htmlFor={allergyId}
      >
        {allergyName}
      </label>
    </div>
  );
}
