import React from 'react';

// New hierarchical structure for the Gemini API response
export interface EtymologyTree {
  word: string;
  language: string;
  meaning?: string;
  era?: string; // Historical period or date range
  context?: string; // Brief historical or linguistic context
  children?: EtymologyTree[];
}

// Internal representation for mindmap nodes
export interface MindmapNode {
  id: string; // Unique ID (e.g., "word-language-level-index")
  text: string; // Display text (e.g., "PIE: *meh₂tēr")
  word: string;
  language: string;
  languageFamily: string; // For color-coding
  meaning?: string;
  era?: string;
  context?: string;
  parentId: string | null;
  childrenIds: string[];
  level: number;
  isExpanded: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // Theme color (hex code for stroke, border)
  highlighted: boolean; // For search highlighting
  // Fields for layout refinement
  subtreeHeight: number;
  subtreeWidth: number;
  childrenYStart: number; // The Y coordinate where its children start
}

export interface TomeProps {
  id: number;
  r?: string;
  ry?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width?: string;
  height?: string;
  bgColorClass: string;
  animationDelay?: string;
  content?: {
    text?: string;
    icon?: React.ReactNode;
    textColorClass?: string;
  };
  isOpened?: boolean;
  lines?: number;
}