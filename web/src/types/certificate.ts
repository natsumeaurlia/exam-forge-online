// Certificate template design types
export interface CertificateDesign {
  layout: 'portrait' | 'landscape';
  dimensions: {
    width: number;
    height: number;
  };
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string;
    opacity: number;
  };
  elements: CertificateElement[];
  variables?: CertificateVariable[];
}

export interface CertificateElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'signature' | 'logo';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
  };
  data?: Record<string, any>; // For dynamic content bindings
}

export interface CertificateVariable {
  name: string;
  label: string;
  type: 'text' | 'date' | 'score' | 'quiz_title' | 'user_name';
  format?: string;
}

// Certificate template with Prisma relations
export interface CertificateTemplateWithRelations {
  id: string;
  name: string;
  description: string | null;
  design: CertificateDesign;
  backgroundImage: string | null;
  logoImage: string | null;
  signatureImage: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  teamId: string;
  createdById: string;
  team: {
    name: string;
  };
  createdBy: {
    name: string | null;
    email: string;
  };
  quizTemplates?: {
    quiz: {
      id: string;
      title: string;
    };
    minScore: number;
    validityDays: number;
    autoIssue: boolean;
  }[];
  _count: {
    certificates: number;
  };
}

// Certificate data for generation
export interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  quizTitle: string;
  score: number;
  completionDate: Date;
  validUntil: Date;
  issuerName: string;
  issuerTitle?: string;
  customFields?: Record<string, string>;
}

// Certificate generation options
export interface CertificateGenerationOptions {
  templateId: string;
  data: CertificateData;
  generateQR?: boolean;
  generatePDF?: boolean;
  emailRecipient?: boolean;
}

// Certificate template form data
export interface CertificateTemplateFormData {
  name: string;
  description?: string;
  design: CertificateDesign;
  backgroundImage?: string;
  logoImage?: string;
  signatureImage?: string;
  isPublic?: boolean;
  tags?: string[];
}

// Design editor state
export interface DesignEditorState {
  selectedElement: string | null;
  clipboardElement: CertificateElement | null;
  undoStack: CertificateDesign[];
  redoStack: CertificateDesign[];
  zoom: number;
  gridVisible: boolean;
  snapToGrid: boolean;
}

// Preset templates
export interface CertificatePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'academic' | 'professional' | 'achievement' | 'participation';
  design: CertificateDesign;
}

// Font options
export interface FontOption {
  family: string;
  name: string;
  weights: string[];
  category: 'serif' | 'sans-serif' | 'monospace' | 'cursive' | 'fantasy';
}

// Color palette
export interface ColorPalette {
  name: string;
  colors: string[];
}

// Certificate template pagination
export interface CertificateTemplatePagination {
  templates: CertificateTemplateWithRelations[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

// Template association with quiz
export interface QuizCertificateAssociation {
  quizId: string;
  templateId: string;
  minScore: number;
  validityDays: number;
  autoIssue: boolean;
  quiz: {
    title: string;
  };
  template: {
    name: string;
  };
}

// Certificate status types
export type CertificateStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

// Export types for reuse
export type {
  CertificateTemplate,
  Certificate,
  QuizCertificateTemplate,
} from '@prisma/client';
