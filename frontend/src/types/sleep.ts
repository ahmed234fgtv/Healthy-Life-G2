export interface SleepFormValues {
  sleepDate: string
  hoursSlept: string
}

export interface SleepPayload {
  sleepDate: string
  hoursSlept: number
}

export interface SleepRecord {
  id: number
  sleepDate: string
  hoursSlept: number
  createdAt: string
}
