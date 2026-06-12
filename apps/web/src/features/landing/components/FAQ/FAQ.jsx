import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './FAQ.module.css'

const GROUPS = [
  {
    id: 'plans',
    label: 'Planos',
    items: [
      {
        q: 'O Plan Things é gratuito para começar?',
        a: 'Sim. O plano Basic é gratuito e oferece 5 projetos ativos, 1 workspace e as visões essenciais para começar. Você pode fazer upgrade quando precisar de mais recursos.',
      },
      {
        q: 'Qual é a diferença entre os planos Professional e Team?',
        a: 'O Professional é ideal para quem precisa de mais automação e profundidade no fluxo de trabalho. O Team adiciona colaboração em escala, papéis, permissões avançadas e integrações mais robustas para equipes.',
      },
      {
        q: 'Posso cancelar ou mudar de plano a qualquer momento?',
        a: 'Sim. Upgrades entram em vigor imediatamente, e mudanças para baixo passam a valer no próximo ciclo. Você pode cancelar quando quiser, sem multa.',
      },
    ],
  },
  {
    id: 'product',
    label: 'Produto',
    items: [
      {
        q: 'Como funciona o recurso de planejamento com IA?',
        a: 'Nosso assistente de IA analisa a descrição do seu projeto e gera uma estrutura de trabalho com tarefas, marcos e responsáveis sugeridos. Você continua no controle: toda sugestão pode ser editada antes de virar ação.',
      },
      {
        q: 'Posso migrar meus projetos do Trello, Asana ou Jira?',
        a: 'Sim. O Plan Things oferece importação com um clique de Trello, Asana, Jira, Linear e Monday.com. Cartões, anexos, prazos e membros são transferidos automaticamente.',
      },
      {
        q: 'O Plan Things funciona offline?',
        a: 'Sim, no mobile. Os apps para iOS e Android permitem visualizar e editar tarefas offline. Quando a conexão volta, as mudanças são sincronizadas automaticamente.',
      },
    ],
  },
  {
    id: 'security',
    label: 'Segurança',
    items: [
      {
        q: 'Meus dados são seguros e privados?',
        a: 'Sim. Todos os dados são criptografados em repouso e em trânsito. O Plan Things segue boas práticas de segurança e não usa os dados privados do seu projeto para treinar modelos.',
      },
    ],
  },
]

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7h8M8 4l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function FAQ() {
  return (
    <div className={styles.section} aria-labelledby="faq-heading">
      <div className={`${styles.inner} container`}>
        <header className={styles.intro}>
          <p className={styles.kicker}>FAQ</p>
          <h2 id="faq-heading" className={styles.heading}>
            Tudo o que você precisa saber antes de começar
          </h2>
        </header>

        <div className={styles.groups}>
          {GROUPS.map((group) => (
            <section key={group.id} className={styles.group} aria-labelledby={`faq-${group.id}`}>
              <h3 id={`faq-${group.id}`} className={styles.groupLabel}>
                {group.label}
              </h3>

              <div className={styles.qaGrid}>
                {group.items.map((item) => (
                  <article key={item.q} className={styles.qaItem}>
                    <h4 className={styles.question}>{item.q}</h4>
                    <p className={styles.answer}>{item.a}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className={styles.footer}>
          <p className={styles.footerText}>Não encontrou o que procura?</p>
          <Link to={ROUTES.help} className={styles.footerLink}>
            Falar com nossa equipe
            <ArrowIcon />
          </Link>
        </footer>
      </div>
    </div>
  )
}
