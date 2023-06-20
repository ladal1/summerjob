export default function FormWarning({ message }: { message?: string }) {
  if (!message) return <></>
  return <p className="text-danger">{message}</p>
}
