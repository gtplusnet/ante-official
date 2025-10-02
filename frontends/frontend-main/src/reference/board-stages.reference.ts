/**
 * Single Source of Truth for Board Stages
 * This file defines all board stages and their configurations
 * Aligned with backend: /backend/src/reference/project-boards.reference.ts
 */

export interface BoardStage {
  boardKey: string;
  boardName: string;
  boardType: 'lead' | 'project';
  boardOrder: number;
}

export interface BoardColumnDisplay {
  key: string;
  title: string;
  stages: string[]; // Maps to boardKey values
  icon: string;
  color: string;
  emptyIcon: string;
  backgroundColor?: string;
  borderColor?: string;
}

// Direct mapping from backend board stages
export const BOARD_STAGES: BoardStage[] = [
  // Lead board stages
  {
    boardKey: 'opportunity',
    boardName: 'Opportunity',
    boardType: 'lead',
    boardOrder: 1,
  },
  {
    boardKey: 'contacted',
    boardName: 'Contacted',
    boardType: 'lead',
    boardOrder: 2,
  },
  {
    boardKey: 'proposal',
    boardName: 'Proposal',
    boardType: 'lead',
    boardOrder: 3,
  },
  {
    boardKey: 'in_negotiation',
    boardName: 'In Negotiation',
    boardType: 'lead',
    boardOrder: 4,
  },
  {
    boardKey: 'win',
    boardName: 'Win',
    boardType: 'lead',
    boardOrder: 5,
  },
  {
    boardKey: 'lost',
    boardName: 'Lost',
    boardType: 'lead',
    boardOrder: 6,
  },
  // Project board stages
  {
    boardKey: 'planning',
    boardName: 'Planning',
    boardType: 'project',
    boardOrder: 1,
  },
  {
    boardKey: 'mobilization',
    boardName: 'Mobilization',
    boardType: 'project',
    boardOrder: 2,
  },
  {
    boardKey: 'construction',
    boardName: 'Construction',
    boardType: 'project',
    boardOrder: 3,
  },
  {
    boardKey: 'done',
    boardName: 'Done',
    boardType: 'project',
    boardOrder: 4,
  },
];

// Project board columns for display (maps backend stages to UI columns)
export const PROJECT_BOARD_COLUMNS: BoardColumnDisplay[] = [
  {
    key: 'planning',
    title: 'Planning',
    stages: ['planning'], // Maps to backend boardKey
    icon: 'architecture',
    color: '#616161', // Grey
    emptyIcon: 'architecture',
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
  },
  {
    key: 'mobilization',
    title: 'Mobilization',
    stages: ['mobilization'], // Maps to backend boardKey
    icon: 'engineering',
    color: '#6D4C41', // Brown
    emptyIcon: 'engineering',
    backgroundColor: '#FFF8E1',
    borderColor: '#D7CCC8',
  },
  {
    key: 'construction',
    title: 'Construction',
    stages: ['construction'], // Maps to backend boardKey
    icon: 'construction',
    color: '#3949AB', // Indigo
    emptyIcon: 'construction',
    backgroundColor: '#E8EAF6',
    borderColor: '#C5CAE9',
  },
  {
    key: 'done',
    title: 'Done',
    stages: ['done'], // Maps to backend boardKey
    icon: 'check_circle',
    color: '#558B2F', // Green
    emptyIcon: 'check_circle_outline',
    backgroundColor: '#F1F8E9',
    borderColor: '#C5E1A5',
  },
];

// Lead board columns for display
export const LEAD_BOARD_COLUMNS: BoardColumnDisplay[] = [
  {
    key: 'opportunity',
    title: 'Opportunity',
    stages: ['opportunity'],
    icon: 'lightbulb',
    color: 'var(--md-sys-color-info)',
    emptyIcon: 'lightbulb_outline',
    backgroundColor: 'var(--md-sys-color-info-container)',
    borderColor: 'var(--md-sys-color-info)',
  },
  {
    key: 'contacted',
    title: 'Contacted',
    stages: ['contacted'],
    icon: 'phone_in_talk',
    color: 'var(--md-sys-color-primary)',
    emptyIcon: 'phone_in_talk',
    backgroundColor: 'var(--md-sys-color-primary-container)',
    borderColor: 'var(--md-sys-color-primary)',
  },
  {
    key: 'proposal',
    title: 'Proposal',
    stages: ['proposal'],
    icon: 'description',
    color: 'var(--md-sys-color-secondary)',
    emptyIcon: 'description',
    backgroundColor: 'var(--md-sys-color-secondary-container)',
    borderColor: 'var(--md-sys-color-secondary)',
  },
  {
    key: 'in_negotiation',
    title: 'In Negotiation',
    stages: ['in_negotiation'],
    icon: 'handshake',
    color: 'var(--md-sys-color-warning)',
    emptyIcon: 'handshake',
    backgroundColor: 'var(--md-sys-color-warning-container)',
    borderColor: 'var(--md-sys-color-warning)',
  },
  {
    key: 'win',
    title: 'Win',
    stages: ['win'],
    icon: 'emoji_events',
    color: 'var(--md-sys-color-success)',
    emptyIcon: 'emoji_events',
    backgroundColor: 'var(--md-sys-color-success-container)',
    borderColor: 'var(--md-sys-color-success)',
  },
  {
    key: 'lost',
    title: 'Lost',
    stages: ['lost'],
    icon: 'cancel',
    color: 'var(--md-sys-color-error)',
    emptyIcon: 'cancel',
    backgroundColor: 'var(--md-sys-color-error-container)',
    borderColor: 'var(--md-sys-color-error)',
  },
];

// Helper functions
export function getProjectBoardColumn(boardStageKey: string): BoardColumnDisplay | undefined {
  return PROJECT_BOARD_COLUMNS.find(col => col.stages.includes(boardStageKey));
}

export function getLeadBoardColumn(boardStageKey: string): BoardColumnDisplay | undefined {
  return LEAD_BOARD_COLUMNS.find(col => col.stages.includes(boardStageKey));
}

export function getBoardStage(boardKey: string): BoardStage | undefined {
  return BOARD_STAGES.find(stage => stage.boardKey === boardKey);
}

export function getProjectBoardStages(): BoardStage[] {
  return BOARD_STAGES.filter(stage => stage.boardType === 'project');
}

export function getLeadBoardStages(): BoardStage[] {
  return BOARD_STAGES.filter(stage => stage.boardType === 'lead');
}

// Color scheme for board stage badges (very subtle, professional colors)
export const BOARD_STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // Project stages with minimal muted colors
  planning: {
    bg: '#F8F8F8', // Almost white grey
    text: '#616161', // Medium grey text
    border: '#E0E0E0', // Light grey border
  },
  mobilization: {
    bg: '#FFFBF5', // Extremely light warm
    text: '#6D4C41', // Muted brown text
    border: '#E0D5CC', // Very light brown border
  },
  construction: {
    bg: '#F5F7FB', // Extremely light blue
    text: '#455A64', // Blue-grey text
    border: '#D6DBE4', // Light blue-grey border
  },
  done: {
    bg: '#F6FAF6', // Extremely light green
    text: '#558B2F', // Muted green text
    border: '#D4E8D4', // Very light green border
  },
  // Lead stages with minimal subtle colors
  opportunity: {
    bg: '#F5FAFA', // Extremely light cyan
    text: '#00695C', // Muted teal text
    border: '#D0E2E0', // Very light teal border
  },
  contacted: {
    bg: '#FBF5F7', // Extremely light purple
    text: '#6A1B9A', // Muted purple text
    border: '#E8D4ED', // Very light purple border
  },
  proposal: {
    bg: '#F7F5FB', // Extremely light indigo
    text: '#4527A0', // Muted indigo text
    border: '#DDD6ED', // Very light indigo border
  },
  in_negotiation: {
    bg: '#FFFBF0', // Extremely light amber
    text: '#E65100', // Muted orange text
    border: '#F5E6CC', // Very light amber border
  },
  win: {
    bg: '#F1F8F1', // Extremely light green
    text: '#2E7D32', // Muted green text
    border: '#C8E6C9', // Very light green border
  },
  lost: {
    bg: '#FFF5F5', // Extremely light red
    text: '#C62828', // Muted red text
    border: '#F5D0D0', // Very light red border
  },
};

// Export type for board stage keys
export type ProjectBoardStageKey = 'planning' | 'mobilization' | 'construction' | 'done';
export type LeadBoardStageKey = 'opportunity' | 'contacted' | 'proposal' | 'in_negotiation' | 'win' | 'lost';
export type BoardStageKey = ProjectBoardStageKey | LeadBoardStageKey;