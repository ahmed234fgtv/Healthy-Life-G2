type FieldErrorProps = { id: string; message?: string }

export default function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p className="field-error" id={id}>
      {message}
    </p>
  )
}
