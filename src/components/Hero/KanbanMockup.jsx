import styles from './KanbanMockup.module.css'

/* ------------------------------------------------------------------ */
/*  Small reusable sub-components                                       */
/* ------------------------------------------------------------------ */

function TaskCard({ title, tag, tagColor, assignee, time, progress }) {
  return (
    <div className={styles.taskCard}>
      <div className={styles.taskTop}>
        <span className={styles.taskTag} style={{ background: tagColor + '20', color: tagColor }}>
          {tag}
        </span>
        {time && <span className={styles.taskTime}>{time}</span>}
      </div>
      <p className={styles.taskTitle}>{title}</p>
      {progress !== undefined && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className={styles.taskFooter}>
        <span className={styles.miniAvatar} style={{ background: assignee }} />
        {progress !== undefined && (
          <span className={styles.progressLabel}>{progress}%</span>
        )}
      </div>
    </div>
  )
}

function Column({ title, count, accentColor, children }) {
  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span className={styles.columnDot} style={{ background: accentColor }} />
        <span className={styles.columnTitle}>{title}</span>
        <span className={styles.columnCount}>{count}</span>
        <button className={styles.columnAdd} aria-label="Adicionar tarefa">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className={styles.columnCards}>{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main mockup                                                         */
/* ------------------------------------------------------------------ */

export default function KanbanMockup() {
  return (
    <div className={styles.mockupRoot}>

      {/* ── Board chrome ── */}
      <div className={styles.boardChrome}>
        <div className={styles.boardHeader}>
          <div className={styles.chromeDots}>
            <span /><span /><span />
          </div>
          <div className={styles.boardTitle}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".9"/>
              <rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".4"/>
              <rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".55"/>
              <rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".7"/>
            </svg>
            <span>Lançamento do produto no 3º tri</span>
          </div>
          <div className={styles.boardActions}>
            <span className={styles.boardFilter}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 4h9M4 7h5M5.5 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Filtrar
            </span>
            <span className={styles.boardShare}>Compartilhar</span>
          </div>
        </div>

        {/* ── Columns ── */}
        <div className={styles.board}>
          <Column title="Backlog" count={8} accentColor="#a0a0a0">
            <TaskCard
              title="Pesquisar análise da concorrência"
              tag="Pesquisa"
              tagColor="#4290da"
              assignee="#d4aef1"
              time="3d"
              progress={0}
            />
            <TaskCard
              title="Definir padrões de acessibilidade"
              tag="Design"
              tagColor="#0f703a"
              assignee="#4290da"
            />
          </Column>

          <Column title="Em andamento" count={4} accentColor="#4290da">
            <TaskCard
              title="Redesenhar fluxo de onboarding"
              tag="Design"
              tagColor="#0f703a"
              assignee="#0f703a"
              time="Entrega seg"
              progress={65}
            />
            <TaskCard
              title="Documentação dos endpoints da API"
              tag="Dev"
              tagColor="#ff6766"
              assignee="#ff6766"
              time="2d"
              progress={30}
            />
          </Column>

          <Column title="Revisão" count={2} accentColor="#d4aef1">
            <TaskCard
              title="Texto da campanha de lançamento"
              tag="Marketing"
              tagColor="#d4aef1"
              assignee="#000"
              time="Hoje"
              progress={90}
            />
          </Column>

          <Column title="Concluído" count={6} accentColor="#0f703a">
            <TaskCard
              title="Síntese das entrevistas com usuários"
              tag="Pesquisa"
              tagColor="#4290da"
              assignee="#d4aef1"
              progress={100}
            />
            <TaskCard
              title="Atualização do sistema de cores da marca"
              tag="Design"
              tagColor="#0f703a"
              assignee="#0f703a"
              progress={100}
            />
          </Column>
        </div>
      </div>

      {/* ── Floating AI bubble ── */}
      <div className={styles.aiBubble}>
        <div className={styles.aiBubbleIcon}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M5 7l1.5 1.5L9.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.aiBubbleText}>
          <p className={styles.aiBubbleLabel}>Sugestão da IA</p>
          <p className={styles.aiBubbleBody}>Mover 3 tarefas do Backlog para o sprint desta semana</p>
        </div>
      </div>

      {/* ── Floating member chip ── */}
      <div className={styles.memberChip}>
        <div className={styles.memberAvatars}>
          {['#d4aef1','#4290da','#0f703a'].map((c,i) => (
            <span key={i} className={styles.memberAvatar} style={{ background: c }} />
          ))}
        </div>
        <span className={styles.memberText}>3 ativos agora</span>
        <span className={styles.memberOnline} />
      </div>

      {/* ── Progress ring chip ── */}
      <div className={styles.progressChip}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#e8e8e8" strokeWidth="3"/>
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke="#0f703a" strokeWidth="3"
            strokeDasharray="87.96" strokeDashoffset="26.4"
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <div className={styles.progressChipText}>
          <span className={styles.progressChipNum}>70%</span>
          <span className={styles.progressChipLabel}>Sprint</span>
        </div>
      </div>
    </div>
  )
}
