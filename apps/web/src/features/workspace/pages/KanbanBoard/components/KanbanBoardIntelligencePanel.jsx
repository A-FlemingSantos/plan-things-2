import IntelligenceComposer from '../../../../../shared/components/IntelligenceComposer/IntelligenceComposer.jsx'
import IntelligenceConversationThread from '../../../../intelligence/components/IntelligenceConversationThread/IntelligenceConversationThread.jsx'

export default function KanbanBoardIntelligencePanel({
  styles,
  isIntelligenceOpen,
  hasIntelligenceConversation,
  intelligencePanelRef,
  intelligencePanelStyle,
  intelligenceMessages,
  isIntelligenceThinking,
  intelligenceDraft,
  setIntelligenceDraft,
  intelligenceComposerInputRef,
  submitIntelligenceMessage,
  canSubmitIntelligenceMessage,
  kanbanAiChips,
  setKanbanAiChips,
  composerContext,
  intelligenceActiveConnectors,
}) {
  return (
    <section
      id="board-intelligence-panel"
      ref={intelligencePanelRef}
      className={`${styles.intelligencePanel} ${hasIntelligenceConversation ? styles.intelligencePanelWithConversation : ''} ${isIntelligenceOpen ? '' : styles.intelligencePanelClosing}`}
      style={intelligencePanelStyle}
      aria-label="Chat de IA"
    >
      <div className={styles.intelligencePanelBody}>
        <div className={styles.intelligencePanelOrbWrap} aria-hidden="true">
          <div className={styles.intelligencePanelOrb} />
        </div>

        {!hasIntelligenceConversation ? (
          <div className={styles.intelligencePanelIntro}>
            <span className={styles.intelligencePanelEyebrow}>Intelligence</span>
            <h2 className={styles.intelligencePanelTitle}>Peça ideias para destravar este plano.</h2>
            <p className={styles.intelligencePanelText}>
              Resumos, sugestões e próximos passos sem sair do plano.
            </p>
          </div>
        ) : null}

        <IntelligenceConversationThread
          messages={intelligenceMessages}
          isThinking={isIntelligenceThinking}
          useCustomScrollbar
          scrollToBottomOnMount
          className={styles.intelligencePanelThread}
          classes={{
            messages: styles.intelligencePanelMessages,
            messageUser: styles.intelligencePanelMessageUser,
            messageAssistant: styles.intelligencePanelMessageAssistant,
            thinking: styles.intelligencePanelThinking,
          }}
        />

        <div
          className={styles.intelligenceComposerArea}
          data-testid="board-intelligence-composer-area"
        >
          <IntelligenceComposer
            value={intelligenceDraft}
            onChange={setIntelligenceDraft}
            inputRef={intelligenceComposerInputRef}
            rows={1}
            placeholder="Escreva sua pergunta..."
            submitAriaLabel="Enviar mensagem"
            voiceAriaLabelIdle="Usar voz"
            voiceAriaLabelListening="Usar voz"
            onSubmit={async (event) => {
              event.preventDefault()
              if (await submitIntelligenceMessage(intelligenceDraft)) {
                setIntelligenceDraft('')
              }
            }}
            submitDisabled={!canSubmitIntelligenceMessage(intelligenceDraft, kanbanAiChips)}
            aiChips={kanbanAiChips}
            onChipsChange={setKanbanAiChips}
            {...composerContext}
            showGitHubBar={intelligenceActiveConnectors.includes('github')}
            githubBarClassName={styles.intelligenceGitHubBar}
            classes={{
              form: styles.intelligenceComposer,
              input: styles.intelligenceComposerInput,
              attachmentStrip: styles.intelligenceComposerAttachmentStrip,
              controls: styles.intelligenceComposerFooter,
              contextSlot: styles.intelligenceComposerTools,
              actions: styles.intelligenceComposerActions,
              iconButton: styles.intelligenceComposerIconButton,
              iconButtonActive: styles.intelligenceComposerIconButtonActive,
              sendButton: styles.intelligenceComposerSubmit,
            }}
          />
        </div>
      </div>
    </section>
  )
}
