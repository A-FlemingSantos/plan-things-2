import { ROUTES } from '../../../shared/config/routes.js'

export const INFO_PAGES = {
  [ROUTES.help]: {
    eyebrow: 'Suporte',
    title: 'Central de ajuda',
    description: 'A área de ajuda ainda não foi implementada. A landing, a autenticação e o workspace principal já estão integrados.',
    primaryLabel: 'Ir para cadastro',
    primaryHref: ROUTES.register,
  },
  [ROUTES.privacy]: {
    eyebrow: 'Legal',
    title: 'Política de privacidade',
    description: 'Esta página ainda está como placeholder enquanto o conteúdo definitivo não entra na aplicação.',
    primaryLabel: 'Voltar',
    primaryHref: ROUTES.home,
  },
  [ROUTES.terms]: {
    eyebrow: 'Legal',
    title: 'Termos de uso',
    description: 'Os termos ainda não foram adicionados. Quando você quiser, posso integrar o conteúdo final aqui.',
    primaryLabel: 'Voltar',
    primaryHref: ROUTES.home,
  },
}
