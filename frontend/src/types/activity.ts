export const ACTIVITY_OPTIONS = [
  { value: 'walking', label: 'Caminar' },
  { value: 'running', label: 'Correr' },
  { value: 'cycling', label: 'Bicicleta' },
  { value: 'gym', label: 'Gimnasio / entrenamiento' },
  { value: 'other', label: 'Otra' },
] as const

export type ActivityType = (typeof ACTIVITY_OPTIONS)[number]['value']

export interface ActivityFormValues {
  activityType: ActivityType | ''
  activityDate: string
  notes: string
}

export interface ActivityPayload {
  activityType: ActivityType
  activityDate: string
  notes?: string
}

export interface Activity {
  id: number
  activityType: ActivityType
  activityDate: string
  notes: string | null
  createdAt: string
}
