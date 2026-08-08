import { useEffect, useRef } from 'react'
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import { Code2, Image as ImageIcon, Link2, Minus, Quote } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'
import { useAuthenticatedImageUrl } from '../../../shared/hooks/useAuthenticatedImageUrl.js'

function AuthenticatedImageView({ node }) {
  const source = useAuthenticatedImageUrl(node.attrs.src)
  return (
    <NodeViewWrapper>
      {source ? <img src={source} alt={node.attrs.alt ?? ''} /> : null}
    </NodeViewWrapper>
  )
}

const AuthenticatedImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AuthenticatedImageView)
  },
})

export default function MarkdownEditor({
  value,
  onChange,
  onAddComment,
  editable,
  placeholder,
  styles,
}) {
  const { accessToken } = useAuth()
  const imageInputRef = useRef(null)
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      AuthenticatedImage,
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value,
    contentType: 'markdown',
    editable,
    onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getMarkdown()),
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
    if (editor.getMarkdown() !== value) {
      editor.commands.setContent(value, { emitUpdate: false, contentType: 'markdown' })
    }
  }, [editable, editor, value])

  if (!editor) return null

  const applyLink = () => {
    const url = window.prompt('Cole a URL do link')
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImage = () => {
    imageInputRef.current?.click()
  }

  const uploadImage = async (event) => {
    const [file] = event.target.files ?? []
    event.target.value = ''
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    const uploaded = await apiRequest('/api/files/upload', {
      method: 'POST',
      token: accessToken,
      body: formData,
    })
    editor.chain().focus().setImage({
      src: `/api/files/${uploaded.id}/download`,
      alt: uploaded.name,
    }).run()
  }

  const addComment = () => {
    const { from, to } = editor.state.selection
    const quotedText = editor.state.doc.textBetween(from, to, ' ')
    if (quotedText) onAddComment?.({ quotedText, selectionStart: from, selectionEnd: to })
  }

  return (
    <div className={styles.composerShell}>
      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={uploadImage} />
      {editable ? (
        <div className={styles.editorToolbar} role="toolbar" aria-label="Formatação do documento">
          <button type="button" className={styles.selectionToolButton} title="Negrito" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
          <button type="button" className={styles.selectionToolButton} title="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()}>i</button>
          <button type="button" className={styles.selectionToolButton} title="Link" onClick={applyLink}><Link2 size={14} /></button>
          <button type="button" className={styles.selectionToolButton} title="Título" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>T</button>
          <button type="button" className={styles.selectionToolButton} title="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></button>
          <button type="button" className={styles.selectionToolButton} title="Código" onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 size={14} /></button>
          <button type="button" className={styles.selectionToolButton} title="Divisor" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={14} /></button>
          <button type="button" className={styles.selectionToolButton} title="Imagem por URL" onClick={insertImage}><ImageIcon size={14} /></button>
          <button type="button" className={styles.selectionToolButton} title="Comentar seleção" onClick={addComment}>+</button>
        </div>
      ) : null}
      <EditorContent editor={editor} className={styles.richTextEditor} />
    </div>
  )
}
