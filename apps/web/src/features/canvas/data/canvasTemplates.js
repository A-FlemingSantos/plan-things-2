export const DEFAULT_CANVAS_PAN = { x: 60, y: 40 }
export const DEFAULT_CANVAS_ZOOM = 1

const SAMPLE_CARDS = [
  {
    id: 'canvas-card-vision',
    x: 160,
    y: 160,
    h: 130,
    title: 'Visão do produto',
    content: 'Criar a ferramenta de gestão mais intuitiva para equipes modernas.',
    colorId: 'stone',
  },
  {
    id: 'canvas-card-research',
    x: 500,
    y: 80,
    h: 130,
    title: 'Pesquisa com usuários',
    content: 'Entrevistar 20 usuários ativos. Identificar os 3 maiores atritos do fluxo atual.',
    colorId: 'blue',
  },
  {
    id: 'canvas-card-system',
    x: 500,
    y: 320,
    h: 130,
    title: 'Design System',
    content: 'Tokens, componentes e padrões. Fonte única para decisões de produto.',
    colorId: 'purple',
  },
  {
    id: 'canvas-card-launch',
    x: 850,
    y: 200,
    h: 130,
    title: 'Lançamento Q3',
    content: 'Release público: 15 de setembro. Preparar changelog, press kit e onboarding.',
    colorId: 'green',
  },
]

const SAMPLE_CONNECTIONS = [
  { id: 'canvas-conn-1', from: 'canvas-card-vision', to: 'canvas-card-research' },
  { id: 'canvas-conn-2', from: 'canvas-card-vision', to: 'canvas-card-system' },
  { id: 'canvas-conn-3', from: 'canvas-card-research', to: 'canvas-card-launch' },
  { id: 'canvas-conn-4', from: 'canvas-card-system', to: 'canvas-card-launch' },
]

export function createEmptyCanvasState() {
  return {
    cards: [],
    connections: [],
    pan: { ...DEFAULT_CANVAS_PAN },
    zoom: DEFAULT_CANVAS_ZOOM,
  }
}

export function createSampleCanvasState() {
  return {
    cards: SAMPLE_CARDS.map((card) => ({ ...card })),
    connections: SAMPLE_CONNECTIONS.map((connection) => ({ ...connection })),
    pan: { ...DEFAULT_CANVAS_PAN },
    zoom: DEFAULT_CANVAS_ZOOM,
  }
}
