import { formatSleepDate, formatSleepHours } from '../lib/sleepStatistics'
import type { SleepRecord } from '../types/sleep'
import './SleepRecordsTable.css'

type SleepRecordsTableProps = { records: SleepRecord[] }

/** Kept independent of the chart bundle so records remain available if it fails. */
export default function SleepRecordsTable({ records }: SleepRecordsTableProps) {
  if (records.length === 0) return null

  return (
    <details className="sleep-evolution-data">
      <summary>
        Ver todos los registros <span>({records.length})</span>
      </summary>
      <div
        className="sleep-evolution-table-wrap"
        role="region"
        aria-label="Tabla de registros de sueño"
        tabIndex={0}
      >
        <table>
          <caption>Datos de la evolución del sueño</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Registro</th>
              <th scope="col">Horas</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} data-sleep-row-id={record.id}>
                <th scope="row">
                  <time dateTime={record.sleepDate}>
                    {formatSleepDate(record.sleepDate)}
                  </time>
                </th>
                <td>#{record.id}</td>
                <td>{formatSleepHours(record.hoursSlept, true)} h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
