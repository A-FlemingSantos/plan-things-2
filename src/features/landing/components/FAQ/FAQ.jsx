import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './FAQ.module.css'

const QUESTIONS = [
  {
    q: "O Plan Things é gratuito para começar?",
    a: "Sim. O plano Basic é gratuito e oferece 5 projetos ativos, 1 workspace e as visões essenciais para começar. Você pode fazer upgrade quando precisar de mais recursos.",
  },
  {
    q: "Como funciona o recurso de planejamento com IA?",
    a: "Nosso assistente de IA analisa a descrição do seu projeto e gera uma estrutura de trabalho com tarefas, marcos e responsáveis sugeridos. Você continua no controle: toda sugestão pode ser editada antes de virar ação.",
  },
  {
    q: "Posso migrar meus projetos do Trello, Asana ou Jira?",
    a: "Sim. O Plan Things oferece importação com um clique de Trello, Asana, Jira, Linear e Monday.com. Cards, anexos, prazos e membros são transferidos automaticamente.",
  },
  {
    q: "Meus dados são seguros e privados?",
    a: "Sim. Todos os dados são criptografados em repouso e em trânsito. O Plan Things segue boas práticas de segurança e não usa os dados privados do seu projeto para treinar modelos.",
  },
  {
    q: "Qual é a diferença entre os planos Professional e Team?",
    a: "O Professional é ideal para quem precisa de mais automação e profundidade no fluxo de trabalho. O Team adiciona colaboração em escala, papéis, permissões avançadas e integrações mais robustas para equipes.",
  },
  {
    q: "Posso cancelar ou mudar de plano a qualquer momento?",
    a: "Sim. Upgrades entram em vigor imediatamente, e mudanças para baixo passam a valer no próximo ciclo. Você pode cancelar quando quiser, sem multa.",
  },
  {
    q: "O Plan Things funciona offline?",
    a: "Sim, no mobile. Os apps para iOS e Android permitem visualizar e editar tarefas offline. Quando a conexão volta, as mudanças são sincronizadas automaticamente.",
  },
]

export default function FAQ() {
  const [openItems, setOpenItems] = useState(new Set([0]))

  const toggle = (i) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const expandAll  = () => setOpenItems(new Set(QUESTIONS.map((_, i) => i)))
  const collapseAll = () => setOpenItems(new Set())

  return (
    <div className={styles.section}>
      <div className={`${styles.inner} container`}>

        {/* Header row */}
        <div className={styles.headerRow}>
          <h2 className={styles.heading}>Perguntas frequentes</h2>
          <div className={styles.controls}>
            <button className={styles.controlBtn} onClick={expandAll}>Expandir tudo</button>
            <button className={styles.controlBtn} onClick={collapseAll}>Recolher tudo</button>
          </div>
        </div>

        {/* Accordion */}
        <div className={styles.list}>
          {QUESTIONS.map((item, i) => (
            <div key={i} className={styles.item}>
              <button
                className={styles.trigger}
                onClick={() => toggle(i)}
                aria-expanded={openItems.has(i)}
              >
                <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.question}>{item.q}</span>
                <span className={`${styles.plusBtn} ${openItems.has(i) ? styles.open : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>

              {openItems.has(i) && (
                <div className={styles.answer}>
                  <p>{item.a}</p>
                </div>
              )}

              <div className={styles.divider} />
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className={styles.footerCta}>
          <p>Ainda tem dúvidas?</p>
          <Link to={ROUTES.help} className={styles.footerLink}>
            Falar com nossa equipe
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
