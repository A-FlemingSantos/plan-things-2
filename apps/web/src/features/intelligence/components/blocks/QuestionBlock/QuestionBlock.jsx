import shared from '../blocksShared.module.css'

export default function QuestionBlock({ block }) {
  const payload = block?.payload ?? {}
  const prompt = String(payload.prompt ?? block?.title ?? '').trim()
  const choices = Array.isArray(payload.choices) ? payload.choices : []

  if (!prompt) return null

  return (
    <section className={shared.shell} data-block-kind="question" aria-label="Pergunta">
      <p className={shared.kicker}>Confirmação</p>
      <p className={shared.title}>{prompt}</p>
      {choices.length > 0 ? (
        <ul className={shared.list}>
          {choices.map((choice) => (
            <li key={choice}>{choice}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
