// Validación en servidor del contrato HU1 (docs/hu1-api.md).
// El frontend también valida, pero el backend nunca se fía de lo que recibe.

export const ACTIVITY_TYPES = ["walking", "running", "cycling", "gym", "other"] as const;
export const NOTES_MAX_LENGTH = 500;

export type ValidationResult =
  | { ok: true; value: { activityType: string; activityDate: string; notes: string | null } }
  | { ok: false; message: string };

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  // Se trabaja en UTC para que la fecha no cambie de día por la zona horaria.
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function validateNewActivity(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "El cuerpo de la petición debe ser un objeto JSON." };
  }
  const { activityType, activityDate, notes } = body as Record<string, unknown>;

  if (typeof activityType !== "string" || !(ACTIVITY_TYPES as readonly string[]).includes(activityType)) {
    return {
      ok: false,
      message: `El tipo de actividad no es válido. Valores permitidos: ${ACTIVITY_TYPES.join(", ")}.`,
    };
  }

  if (typeof activityDate !== "string" || !isRealDate(activityDate)) {
    return { ok: false, message: "La fecha de la actividad no es válida." };
  }

  let cleanNotes: string | null = null;
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== "string") {
      return { ok: false, message: "Las notas deben ser texto." };
    }
    const trimmed = notes.trim();
    if (trimmed.length > NOTES_MAX_LENGTH) {
      return { ok: false, message: `Las notas no pueden superar ${NOTES_MAX_LENGTH} caracteres.` };
    }
    cleanNotes = trimmed === "" ? null : trimmed;
  }

  return { ok: true, value: { activityType, activityDate, notes: cleanNotes } };
}
