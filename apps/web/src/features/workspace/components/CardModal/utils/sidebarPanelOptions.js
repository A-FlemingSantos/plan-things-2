import { ListChecks, MessageSquareText, Paperclip } from 'lucide-react'
import { SiGithub } from 'react-icons/si'

export const SIDEBAR_PANEL_OPTIONS = [
  { id: 'github', label: 'GitHub', Icon: SiGithub },
  { id: 'activity', label: 'Activity', Icon: MessageSquareText },
  { id: 'files', label: 'Arquivos', Icon: Paperclip },
  { id: 'checklist', label: 'Checklist', Icon: ListChecks },
]
