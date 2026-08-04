import styles from './Workspace.module.css'

function VerticalBarChart({ title, series = [], emptyLabel = 'Sem dados ainda' }) {
  const maxValue = Math.max(...series.map((item) => item.value), 1)

  return (
    <article className={styles.chartCard}>
      <header className={styles.chartCardHeader}>
        <h3 className={styles.chartCardTitle}>{title}</h3>
      </header>
      {series.length === 0 ? (
        <p className={styles.chartEmpty}>{emptyLabel}</p>
      ) : (
        <div className={styles.verticalChart}>
          <div className={styles.verticalChartPlot} aria-hidden="true">
            {series.map((item) => (
              <div key={item.id} className={styles.verticalChartColumn}>
                <div
                  className={styles.verticalChartBar}
                  style={{ height: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className={styles.verticalChartLabels}>
            {series.map((item) => (
              <span key={item.id} className={styles.verticalChartLabel} title={item.label}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function HorizontalBarChart({ title, series = [], emptyLabel = 'Sem dados ainda' }) {
  const maxValue = Math.max(...series.map((item) => item.value), 1)

  return (
    <article className={styles.chartCard}>
      <header className={styles.chartCardHeader}>
        <h3 className={styles.chartCardTitle}>{title}</h3>
      </header>
      {series.length === 0 ? (
        <p className={styles.chartEmpty}>{emptyLabel}</p>
      ) : (
        <div className={styles.horizontalChart}>
          {series.map((item) => (
            <div key={item.id} className={styles.horizontalChartRow}>
              <span className={styles.horizontalChartLabel} title={item.label}>
                {item.label}
              </span>
              <div className={styles.horizontalChartTrack}>
                <div
                  className={styles.horizontalChartBar}
                  style={{ width: `${Math.max(6, (item.value / maxValue) * 100)}%` }}
                >
                  <span className={styles.horizontalChartValue}>{item.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export default function WorkspaceChartsSection({
  tasksSeries,
  membersSeries,
}) {
  return (
    <div className={styles.chartsGrid}>
      <VerticalBarChart
        title="Tarefas por plano"
        series={tasksSeries}
        emptyLabel="Crie planos para visualizar tarefas."
      />
      <HorizontalBarChart
        title="Membros por plano"
        series={membersSeries}
        emptyLabel="Convide membros para visualizar a distribuição."
      />
    </div>
  )
}
