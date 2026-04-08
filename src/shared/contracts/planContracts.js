import { createClientId } from '../utils/createClientId.js'

function normalizeComment(comment = {}) {
  return {
    id: comment.id ?? createClientId('comment'),
    author: comment.author ?? '',
    text: comment.text ?? '',
    time: comment.time ?? '',
  }
}

function normalizeBoardCard(card = {}) {
  return {
    id: card.id ?? createClientId('card'),
    title: card.title ?? 'Untitled card',
    description: card.description ?? '',
    labelId: card.labelId ?? '',
    memberIds: Array.isArray(card.memberIds) ? card.memberIds.filter(Boolean) : [],
    dueDate: card.dueDate ?? '',
    comments: Array.isArray(card.comments) ? card.comments.map(normalizeComment) : [],
  }
}

function normalizeBoardColumn(column = {}) {
  return {
    id: column.id ?? createClientId('col'),
    title: column.title ?? 'Untitled list',
    color: column.color ?? '#a0a0a0',
    cards: Array.isArray(column.cards) ? column.cards.map(normalizeBoardCard) : [],
  }
}

function normalizeCanvasCard(card = {}) {
  return {
    id: card.id ?? createClientId('canvas-card'),
    x: Number.isFinite(card.x) ? card.x : 0,
    y: Number.isFinite(card.y) ? card.y : 0,
    h: Number.isFinite(card.h) ? card.h : 130,
    title: card.title ?? 'Untitled card',
    content: card.content ?? '',
    colorId: card.colorId ?? 'stone',
  }
}

function normalizeCanvasConnection(connection = {}) {
  return {
    id: connection.id ?? createClientId('canvas-conn'),
    from: connection.from ?? '',
    to: connection.to ?? '',
  }
}

export function normalizeCanvasState(canvasState = {}) {
  return {
    cards: Array.isArray(canvasState.cards) ? canvasState.cards.map(normalizeCanvasCard) : [],
    connections: Array.isArray(canvasState.connections) ? canvasState.connections.map(normalizeCanvasConnection) : [],
    pan: {
      x: Number.isFinite(canvasState.pan?.x) ? canvasState.pan.x : 0,
      y: Number.isFinite(canvasState.pan?.y) ? canvasState.pan.y : 0,
    },
    zoom: Number.isFinite(canvasState.zoom) ? canvasState.zoom : 1,
  }
}

export function normalizePlanRecord(plan = {}) {
  return {
    id: plan.id ?? createClientId('plan'),
    name: plan.name ?? 'Untitled plan',
    description: plan.description ?? '',
    tag: plan.tag ?? 'General',
    tagColor: plan.tagColor ?? '#a0a0a0',
    members: Array.isArray(plan.members) ? plan.members.filter(Boolean) : [],
    date: plan.date ?? '',
    tasks: Number.isFinite(plan.tasks) ? plan.tasks : 0,
    cover: plan.cover ?? '#f5f5f5',
    boardColumns: Array.isArray(plan.boardColumns) ? plan.boardColumns.map(normalizeBoardColumn) : [],
    canvasState: normalizeCanvasState(plan.canvasState),
  }
}

