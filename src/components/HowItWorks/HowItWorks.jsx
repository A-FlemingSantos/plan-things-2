import { useState } from 'react'
import styles from './HowItWorks.module.css'

const TABS = [
  'Planeje com clareza',
  'Organize visualmente',
  'Colabore mais rápido',
  'Automatize o trabalho repetitivo',
]

/* ─────────────────────────────────────────────────
   VISUAL 1 — Plan with clarity
   Reference height. All others must match.
   ───────────────────────────────────────────────── */
function PlanVisual() {
  return (
    <div className={styles.visualCard}>
      <div className={styles.visualHeader}>
        <span className={styles.visualDot} style={{ background: 'var(--color-blue)' }} />
        <span className={styles.visualHeaderText}>Quebra de tarefas com IA</span>
      </div>

      <div className={styles.promptCard}>
        <div className={styles.promptIcon}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className={styles.promptText}>&ldquo;Lançar o novo checkout em 3 semanas&rdquo;</p>
      </div>

      <div className={styles.taskBubbles}>
        {[
          { label: 'Auditoria de UX', color: 'var(--color-blue)', w: 65 },
          { label: 'Wireframes', color: 'var(--color-purple)', w: 80 },
          { label: 'Handoff para dev', color: 'var(--color-green)', w: 50 },
          { label: 'Teste de QA', color: 'var(--color-red)', w: 45 },
          { label: 'Rollout gradual', color: '#a0a0a0', w: 35 },
        ].map((t, i) => (
          <div key={i} className={styles.taskBubble} style={{ '--delay': `${i * 70}ms` }}>
            <span className={styles.taskBubbleDot} style={{ background: t.color }} />
            <span className={styles.taskBubbleLabel}>{t.label}</span>
            <div className={styles.taskBubbleBar}>
              <div style={{ width: `${t.w}%`, background: t.color, height: '100%', borderRadius: '2px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Extra block — sprint assignment */}
      <div className={styles.assignmentRow}>
        <div className={styles.assignmentBlock}>
          <p className={styles.assignmentLabel}>Sprint</p>
          <p className={styles.assignmentValue}>Semana 1–3</p>
        </div>
        <div className={styles.assignmentBlock}>
          <p className={styles.assignmentLabel}>Responsáveis</p>
          <div className={styles.assignmentAvatars}>
            {['#d4aef1','#4290da','#0f703a'].map((c,i) => (
              <span key={i} className={styles.assignmentAvatar} style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className={styles.assignmentBlock}>
          <p className={styles.assignmentLabel}>Confiança</p>
          <p className={styles.assignmentValue} style={{ color: 'var(--color-green)' }}>Alta</p>
        </div>
      </div>

      <div className={styles.visualFooter}>
        <span className={styles.visualCheck}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className={styles.visualFooterText}>5 tarefas geradas &middot; Prontas para atribuir</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   VISUAL 2 — Organize visually
   ───────────────────────────────────────────────── */
function OrganizeVisual() {
  const cols = [
    { name: 'Backlog', color: '#a0a0a0', cards: [{ title: 'Refresh da marca', tag: 'Design', p: 0 }, { title: 'Docs da API', tag: 'Dev', p: 0 }] },
    { name: 'Em andamento', color: 'var(--color-blue)', cards: [{ title: 'Fluxo de onboarding', tag: 'Design', p: 60 }, { title: 'Módulo de auth', tag: 'Dev', p: 35 }] },
    { name: 'Revisão', color: 'var(--color-purple)', cards: [{ title: 'Texto da campanha', tag: 'Marketing', p: 90 }] },
    { name: 'Concluído', color: 'var(--color-green)', cards: [{ title: 'Entrevistas com usuários', tag: 'Pesquisa', p: 100 }] },
  ]
  return (
    <div className={styles.visualCard}>
      <div className={styles.visualHeader}>
        <span className={styles.visualDot} style={{ background: 'var(--color-purple)' }} />
        <span className={styles.visualHeaderText}>Quadro Kanban</span>
        <div className={styles.boardControls}>
          <span className={styles.boardControlChip}>Agrupar: Status</span>
          <span className={styles.boardControlChip}>Filtrar</span>
        </div>
      </div>

      {/* View switcher */}
      <div className={styles.viewSwitcher}>
        {['Quadro','Lista','Linha do tempo','Calendário'].map((v, i) => (
          <span key={v} className={`${styles.viewChip} ${i === 0 ? styles.viewChipActive : ''}`}>{v}</span>
        ))}
      </div>

      <div className={styles.miniBoard}>
        {cols.map((col, ci) => (
          <div key={col.name} className={styles.miniBoardCol}>
            <div className={styles.miniBoardColHead}>
              <span className={styles.miniBoardDot} style={{ background: col.color }} />
              <span className={styles.miniBoardColName}>{col.name}</span>
            </div>
            {col.cards.map((card, i) => (
              <div key={i} className={styles.miniBoardCard} style={{ '--delay': `${(ci * 2 + i) * 60}ms` }}>
                <span className={styles.miniBoardCardTag}>{card.tag}</span>
                <p className={styles.miniBoardCardTitle}>{card.title}</p>
                <div className={styles.miniBoardCardBar}>
                  <div style={{ width: `${card.p || 8}%`, background: col.color, height: '100%', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Label legend */}
      <div className={styles.labelLegend}>
        {[
          { name: 'Design',    color: 'var(--color-purple)' },
          { name: 'Dev',       color: 'var(--color-blue)'   },
          { name: 'Marketing', color: 'var(--color-red)'    },
          { name: 'Pesquisa',  color: 'var(--color-green)'  },
        ].map(l => (
          <span key={l.name} className={styles.labelChip} style={{ background: l.color + '18', color: l.color }}>
            {l.name}
          </span>
        ))}
      </div>

      {/* Board stats row */}
      <div className={styles.boardStats}>
        <div className={styles.boardStat}><span className={styles.boardStatNum}>12</span><span className={styles.boardStatLabel}>Tarefas totais</span></div>
        <div className={styles.boardStatDiv} />
        <div className={styles.boardStat}><span className={styles.boardStatNum}>4</span><span className={styles.boardStatLabel}>Em andamento</span></div>
        <div className={styles.boardStatDiv} />
        <div className={styles.boardStat}><span className={styles.boardStatNum} style={{ color: 'var(--color-green)' }}>3</span><span className={styles.boardStatLabel}>Concluídas hoje</span></div>
      </div>

      <div className={styles.visualFooter}>
        <span className={styles.visualCheck} style={{ background: 'var(--color-purple)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className={styles.visualFooterText}>Quadro sincronizado &middot; Atualizado agora</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   VISUAL 3 — Collaborate faster
   ───────────────────────────────────────────────── */
function CollaborateVisual() {
  const members = [
    { name: 'Ana R.',  color: '#d4aef1', status: 'Editando “Fluxo de onboarding”', online: true },
    { name: 'Tom K.',  color: '#4290da', status: 'Revisou 2 tarefas', online: true },
    { name: 'Sara M.', color: '#0f703a', status: 'Adicionou comentário · 3 min', online: false },
  ]
  return (
    <div className={styles.visualCard}>
      <div className={styles.visualHeader}>
        <span className={styles.visualDot} style={{ background: 'var(--color-green)' }} />
        <span className={styles.visualHeaderText}>Colaboração ao vivo</span>
        <span className={styles.liveBadge}>3 ativos</span>
      </div>

      {/* Activity feed */}
      <div className={styles.activityFeed}>
        {[
          { text: 'Ana moveu “Fluxo de onboarding” para Revisão', time: '1 min', color: '#d4aef1' },
          { text: 'Tom aprovou “Docs da API”', time: '4 min', color: '#4290da' },
          { text: 'Meta do sprint atualizada pela Sara', time: '9 min', color: '#0f703a' },
        ].map((a, i) => (
          <div key={i} className={styles.activityRow} style={{ '--delay': `${i * 60}ms` }}>
            <span className={styles.activityDot} style={{ background: a.color }} />
            <span className={styles.activityText}>{a.text}</span>
            <span className={styles.activityTime}>{a.time}</span>
          </div>
        ))}
      </div>

      <div className={styles.memberList}>
        {members.map((m, i) => (
          <div key={i} className={styles.memberRow} style={{ '--delay': `${i * 80}ms` }}>
            <div className={styles.memberAvatarWrap}>
              <span className={styles.memberAvatar} style={{ background: m.color }} />
              {m.online && <span className={styles.memberOnlineDot} />}
            </div>
            <div className={styles.memberInfo}>
              <p className={styles.memberName}>{m.name}</p>
              <p className={styles.memberStatus}>{m.status}</p>
            </div>
            <span className={styles.memberActivity} style={{ background: m.color + '20', color: m.color }}>
              {m.online ? 'Ativo' : 'Ausente'}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.commentCard}>
        <div className={styles.commentBubble}>
          <p className={styles.commentText}>Podemos mover isso para o próximo sprint? As dependências ainda estão pendentes.</p>
          <span className={styles.commentMeta}>Sara M. &middot; Tarefa #42</span>
        </div>
        <div className={styles.commentActions}>
          <span className={styles.commentAction}>Responder</span>
          <span className={styles.commentAction}>Resolver</span>
        </div>
      </div>

      <div className={styles.visualFooter}>
        <span className={styles.visualCheck} style={{ background: 'var(--color-green)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className={styles.visualFooterText}>Todas as mudanças salvas &middot; Sem conflitos</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   VISUAL 4 — Automate routine work
   ───────────────────────────────────────────────── */
function AutomateVisual() {
  const rules = [
    { trigger: 'Tarefa movida para Concluído', action: 'Notificar equipe no Slack', color: 'var(--color-green)', active: true },
    { trigger: 'Prazo em 2 dias', action: 'Definir prioridade: Alta', color: 'var(--color-red)', active: true },
    { trigger: 'Nova tarefa no Backlog', action: 'Atribuir automaticamente para revisão de IA', color: 'var(--color-blue)', active: false },
    { trigger: 'Sprint concluído', action: 'Gerar relatório semanal', color: 'var(--color-purple)', active: true },
  ]
  return (
    <div className={styles.visualCard}>
      <div className={styles.visualHeader}>
        <span className={styles.visualDot} style={{ background: 'var(--color-red)' }} />
        <span className={styles.visualHeaderText}>Regras de automação</span>
        <span className={styles.automateCount}>4 regras</span>
      </div>

      {/* Stats row */}
      <div className={styles.automateStats}>
        <div className={styles.automateStat}>
          <span className={styles.automateStatNum}>127</span>
          <span className={styles.automateStatLabel}>Execuções nesta semana</span>
        </div>
        <div className={styles.boardStatDiv} />
        <div className={styles.automateStat}>
          <span className={styles.automateStatNum} style={{ color: 'var(--color-green)' }}>3h 40m</span>
          <span className={styles.automateStatLabel}>Tempo economizado</span>
        </div>
        <div className={styles.boardStatDiv} />
        <div className={styles.automateStat}>
          <span className={styles.automateStatNum} style={{ color: 'var(--color-green)' }}>0</span>
          <span className={styles.automateStatLabel}>Erros</span>
        </div>
      </div>

      <div className={styles.ruleList}>
        {rules.map((r, i) => (
          <div key={i} className={styles.ruleRow} style={{ '--delay': `${i * 70}ms` }}>
            <div className={styles.ruleTrigger}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke={r.color} strokeWidth="1.2"/>
                <path d="M3.5 5.5l1.5 1.5 2.5-2.5" stroke={r.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{r.trigger}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={styles.ruleArrow}>
              <path d="M3 7h8M8 4l3 3-3 3" stroke="var(--color-gray-300)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.ruleAction}><span>{r.action}</span></div>
            <span className={`${styles.ruleToggle} ${r.active ? styles.ruleToggleOn : ''}`} />
          </div>
        ))}
      </div>

      {/* Last run */}
      <div className={styles.lastRun}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--color-gray-300)" strokeWidth="1.2"/>
          <path d="M6.5 3.5v3l2 1.5" stroke="var(--color-gray-400)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className={styles.lastRunText}>Última execução: há 2 minutos &middot; Notificação enviada no Slack</span>
      </div>

      <div className={styles.visualFooter}>
        <span className={styles.visualCheck} style={{ background: 'var(--color-red)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className={styles.visualFooterText}>3 de 4 regras ativas &middot; 0 erros</span>
      </div>
    </div>
  )
}

const TAB_VISUALS = [PlanVisual, OrganizeVisual, CollaborateVisual, AutomateVisual]

/* ─────────────────────────────────────────────────
   ACCORDION DATA PER TAB
   ───────────────────────────────────────────────── */
const TAB_ACCORDIONS = [
  [
    { title: 'Quebre projetos em etapas claras e acionáveis', body: 'O Plan Things ajuda você a decompor qualquer objetivo em tarefas estruturadas. A IA lê o seu briefing e propõe instantaneamente um plano completo com marcos, subtarefas, responsáveis e prazos.', link: 'Saiba mais sobre planejamento com IA' },
    { title: 'Defina prioridades e prazos sem atrito', body: 'Agendamento por arrastar e soltar, alertas inteligentes e priorização que se adapta ao avanço da equipe.', link: 'Ver recursos de planejamento' },
    { title: 'Sincronize o roadmap com todos os envolvidos', body: 'Compartilhe roadmaps ao vivo, incorpore cronogramas em documentos e dê visibilidade sem poluir o workspace.', link: 'Explorar compartilhamento de roadmap' },
    { title: 'Acompanhe o progresso com status automáticos', body: 'O status é consolidado em tempo real. Menos relatórios manuais e menos reuniões de atualização.', link: 'Ver ferramentas de relatório' },
  ],
  [
    { title: 'Modele o quadro do jeito que você pensa', body: 'Campos personalizados, swimlanes, rótulos por cor e agrupamentos permitem adaptar o quadro a qualquer fluxo.', link: 'Ver personalização do quadro' },
    { title: 'Filtre e foque sem perder contexto', body: 'Visualizações com múltiplos filtros isolam o que importa agora. Salve views por pessoa ou por fase do projeto.', link: 'Explorar visualizações' },
    { title: 'Alterne entre Kanban, Lista e Linha do tempo em um clique', body: 'Cada quadro é ao mesmo tempo Kanban, lista e cronograma. Mude de visual sem migrar dados.', link: 'Testar linha do tempo' },
    { title: 'Use cores e rótulos em escala', body: 'Um sistema visual de marcação que funciona em centenas de tarefas sem virar ruído.', link: 'Ver sistema de rótulos' },
  ],
  [
    { title: 'Veja quem está fazendo o quê, agora', body: 'Indicadores de presença, atividade em tempo real e feeds instantâneos mantêm a equipe alinhada sem interromper o fluxo.', link: 'Ver recursos de colaboração' },
    { title: 'Comente direto em tarefas e subtarefas', body: 'Comentários em thread, @menções e reações mantêm as conversas ligadas ao trabalho.', link: 'Explorar comentários' },
    { title: 'Defina revisores e aprovadores em um passo', body: 'Fluxos de revisão com responsáveis, prazos e aprovação em um clique, sem perseguição por sign-off.', link: 'Saiba mais sobre revisões' },
    { title: 'Compartilhe quadros com convidados e clientes', body: 'Colaboradores externos recebem acesso limitado de visualização ou comentário, ideal para dar visibilidade a clientes.', link: 'Ver acesso de convidados' },
  ],
  [
    { title: 'Crie automações sem código em minutos', body: 'Automações de gatilho e ação permitem mover cards, enviar alertas, atribuir tarefas e atualizar campos sem escrever código.', link: 'Explorar automações' },
    { title: 'Conecte Slack, GitHub e Zapier', body: 'Integrações prontas enviam a informação certa para o lugar certo no momento em que algo muda no seu quadro.', link: 'Ver integrações' },
    { title: 'Gere relatórios de status automaticamente', body: 'Defina uma frequência e o Plan Things monta seu resumo semanal, envia para a equipe e arquiva nos docs.', link: 'Ver relatórios' },
    { title: 'Tarefas recorrentes que se recriam sozinhas', body: 'Defina um template uma vez. O Plan Things recria a tarefa, reatribui e reajusta a timeline automaticamente.', link: 'Saiba mais sobre tarefas recorrentes' },
  ],
]

const TAB_LINK_TARGETS = ['#innovation', '#features', '#pricing', '#ecosystem']

/* ─────────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────────── */
export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0)
  const [openItem, setOpenItem]   = useState(0)

  const Visual    = TAB_VISUALS[activeTab]
  const accordion = TAB_ACCORDIONS[activeTab]

  const handleTabChange = (i) => {
    setActiveTab(i)
    setOpenItem(0)
  }

  return (
    <div className={styles.section}>
      <div className={`${styles.inner} container`}>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Como funciona</p>
          <h2 className={styles.heading}>
            Uma forma mais inteligente de gerenciar<br />
            <span className={styles.headingLight}>qualquer tipo de trabalho</span>
          </h2>
        </div>

        <div className={styles.tabs} role="tablist">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === i}
              className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.layout}>
          <div className={styles.accordion}>
            <div className={styles.accentLine} />
            {accordion.map((item, i) => (
              <div key={`${activeTab}-${i}`} className={styles.accordionItem}>
                <button
                  className={`${styles.accordionBtn} ${openItem === i ? styles.open : ''}`}
                  onClick={() => setOpenItem(i === openItem ? -1 : i)}
                  aria-expanded={openItem === i}
                >
                  <span className={styles.accordionTitle}>{item.title}</span>
                  <span className={styles.accordionChevron}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
                {openItem === i && (
                  <div className={styles.accordionBody}>
                    <p className={styles.accordionText}>{item.body}</p>
                    <a href={TAB_LINK_TARGETS[activeTab]} className={styles.accordionLink}>
                      {item.link}
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 6.5h9M8 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  </div>
                )}
                <div className={styles.accordionDivider} />
              </div>
            ))}
          </div>

          <div className={styles.visualPanel} key={activeTab}>
            <Visual />
          </div>
        </div>
      </div>
    </div>
  )
}
