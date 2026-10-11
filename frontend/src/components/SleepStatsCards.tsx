import {
  formatSleepDate,
  formatSleepHours,
  summarizeSleep,
} from '../lib/sleepStatistics'

type SleepStatsCardsProps = { statistics: ReturnType<typeof summarizeSleep> }

export default function SleepStatsCards({ statistics }: SleepStatsCardsProps) {
  const { count, total, average, max, min } = statistics
  if (average === null || !max || !min) return null

  return (
    <dl className="sleep-stats" aria-label="Estadísticas del período">
      <div className="sleep-stat sleep-stat-primary">
        <dt>Media por registro</dt>
        <dd>
          <span className="sleep-stat-value" data-testid="sleep-stat-average">
            {formatSleepHours(average)}
          </span>
          <span className="sleep-stat-unit">horas</span>
          <span className="sleep-stat-detail">
            Solo los registros que has guardado.
          </span>
        </dd>
      </div>
      <div className="sleep-stat">
        <dt>Total de horas</dt>
        <dd>
          <span className="sleep-stat-value" data-testid="sleep-stat-total">
            {formatSleepHours(total)}
          </span>
          <span className="sleep-stat-unit">horas</span>
          <span className="sleep-stat-detail">Suma del período</span>
        </dd>
      </div>
      <div className="sleep-stat">
        <dt>Registros</dt>
        <dd>
          <span className="sleep-stat-value" data-testid="sleep-stat-count">
            {new Intl.NumberFormat('es-ES').format(count)}
          </span>
          <span className="sleep-stat-unit">
            {count === 1 ? 'registro' : 'registros'}
          </span>
          <span className="sleep-stat-detail">Cada entrada cuenta</span>
        </dd>
      </div>
      <div className="sleep-stat">
        <dt>Máximo registrado</dt>
        <dd>
          <span className="sleep-stat-value" data-testid="sleep-stat-max">
            {formatSleepHours(max.hoursSlept)}
          </span>
          <span className="sleep-stat-unit">horas</span>
          <span className="sleep-stat-detail">
            {formatSleepDate(max.sleepDate)}
          </span>
        </dd>
      </div>
      <div className="sleep-stat">
        <dt>Mínimo registrado</dt>
        <dd>
          <span className="sleep-stat-value" data-testid="sleep-stat-min">
            {formatSleepHours(min.hoursSlept)}
          </span>
          <span className="sleep-stat-unit">horas</span>
          <span className="sleep-stat-detail">
            {formatSleepDate(min.sleepDate)}
          </span>
        </dd>
      </div>
    </dl>
  )
}
