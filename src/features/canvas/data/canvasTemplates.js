export const DEFAULT_CANVAS_PAN = { x: 60, y: 40 }
export const DEFAULT_CANVAS_ZOOM = 1

const SAMPLE_CARDS = [
  {
    id: 'canvas-card-vision',
    x: 160,
    y: 160,
    h: 130,
    title: 'Product Vision',
    content: 'Build the most intuitive project management tool for modern teams who think clearly.',
    colorId: 'stone',
  },
  {
    id: 'canvas-card-research',
    x: 500,
    y: 80,
    h: 130,
    title: 'User Research',
    content: 'Interview 20 active users. Identify the top 3 pain points in their current workflow.',
    colorId: 'blue',
  },
  {
    id: 'canvas-card-system',
    x: 500,
    y: 320,
    h: 130,
    title: 'Design System',
    content: 'Tokens, components, patterns. Single source of truth for all product decisions.',
    colorId: 'purple',
  },
  {
    id: 'canvas-card-launch',
    x: 850,
    y: 200,
    h: 130,
    title: 'Q3 Launch',
    content: 'Public release: September 15. Prepare changelog, press kit, and onboarding flow.',
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
