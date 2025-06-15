import { QuestionType, QuestionDifficulty } from '@prisma/client';

export interface CSVQuestionRow {
  type: string;
  text: string;
  points: string;
  difficulty: string;
  hint?: string;
  explanation?: string;
  option1?: string;
  option1_correct?: string;
  option2?: string;
  option2_correct?: string;
  option3?: string;
  option3_correct?: string;
  option4?: string;
  option4_correct?: string;
  categories?: string;
  tags?: string;
}

export interface ParsedQuestion {
  type: QuestionType;
  text: string;
  points: number;
  difficulty: QuestionDifficulty;
  hint?: string;
  explanation?: string;
  options?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  categoryNames?: string[];
  tagNames?: string[];
}

export function parseCSV(csvContent: string): ParsedQuestion[] {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV must contain header and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const questions: ParsedQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length < headers.length) {
      // Skip incomplete rows
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    try {
      const question = parseQuestionRow(row as CSVQuestionRow);
      questions.push(question);
    } catch (error) {
      console.warn(`Error parsing row ${i + 1}:`, error);
      // Continue with other rows
    }
  }

  return questions;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

function parseQuestionRow(row: CSVQuestionRow): ParsedQuestion {
  // Validate and parse question type
  const type = parseQuestionType(row.type);

  // Validate required fields
  if (!row.text?.trim()) {
    throw new Error('Question text is required');
  }

  // Parse points
  const points = parseInt(row.points) || 1;
  if (points < 1) {
    throw new Error('Points must be at least 1');
  }

  // Parse difficulty
  const difficulty = parseDifficulty(row.difficulty);

  // Parse options for multiple choice questions
  const options = parseOptions(row, type);

  // Parse categories and tags
  const categoryNames = row.categories
    ? row.categories
        .split(';')
        .map(c => c.trim())
        .filter(Boolean)
    : undefined;

  const tagNames = row.tags
    ? row.tags
        .split(';')
        .map(t => t.trim())
        .filter(Boolean)
    : undefined;

  return {
    type,
    text: row.text.trim(),
    points,
    difficulty,
    hint: row.hint?.trim() || undefined,
    explanation: row.explanation?.trim() || undefined,
    options,
    categoryNames,
    tagNames,
  };
}

function parseQuestionType(typeStr: string): QuestionType {
  const normalizedType = typeStr.toUpperCase().trim();

  switch (normalizedType) {
    case 'SINGLE_CHOICE':
    case 'SINGLE':
    case 'CHOICE':
      return 'SINGLE_CHOICE';
    case 'MULTIPLE_CHOICE':
    case 'MULTIPLE':
      return 'MULTIPLE_CHOICE';
    case 'TRUE_FALSE':
    case 'TRUE/FALSE':
    case 'BOOL':
    case 'BOOLEAN':
      return 'TRUE_FALSE';
    case 'SHORT_ANSWER':
    case 'SHORT':
    case 'TEXT':
      return 'SHORT_ANSWER';
    default:
      throw new Error(`Invalid question type: ${typeStr}`);
  }
}

function parseDifficulty(difficultyStr: string): QuestionDifficulty {
  const normalizedDifficulty = difficultyStr.toUpperCase().trim();

  switch (normalizedDifficulty) {
    case 'EASY':
    case 'E':
    case '1':
    case '初級':
    case '簡単':
      return 'EASY';
    case 'MEDIUM':
    case 'M':
    case '2':
    case '中級':
    case '普通':
      return 'MEDIUM';
    case 'HARD':
    case 'H':
    case '3':
    case '上級':
    case '難しい':
      return 'HARD';
    default:
      throw new Error(`Invalid difficulty: ${difficultyStr}`);
  }
}

function parseOptions(
  row: CSVQuestionRow,
  type: QuestionType
): Array<{ text: string; isCorrect: boolean }> | undefined {
  if (type === 'SHORT_ANSWER') {
    return undefined;
  }

  const options: Array<{ text: string; isCorrect: boolean }> = [];

  for (let i = 1; i <= 4; i++) {
    const optionText = row[`option${i}` as keyof CSVQuestionRow];
    const optionCorrect = row[`option${i}_correct` as keyof CSVQuestionRow];

    if (optionText?.trim()) {
      options.push({
        text: optionText.trim(),
        isCorrect: parseBoolean(optionCorrect),
      });
    }
  }

  if (options.length === 0) {
    throw new Error('At least one option is required for choice questions');
  }

  // Validate that at least one option is correct
  const hasCorrectOption = options.some(opt => opt.isCorrect);
  if (!hasCorrectOption) {
    throw new Error('At least one option must be marked as correct');
  }

  return options;
}

function parseBoolean(value?: string): boolean {
  if (!value) return false;

  const normalized = value.toLowerCase().trim();
  return (
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes' ||
    normalized === 'y'
  );
}

export function generateCSVTemplate(): string {
  const headers = [
    'type',
    'text',
    'points',
    'difficulty',
    'hint',
    'explanation',
    'option1',
    'option1_correct',
    'option2',
    'option2_correct',
    'option3',
    'option3_correct',
    'option4',
    'option4_correct',
    'categories',
    'tags',
  ];

  const sampleRow = [
    'SINGLE_CHOICE',
    'What is the capital of Japan?',
    '1',
    'EASY',
    'Think about the largest city in Japan',
    'Tokyo is the capital and largest city of Japan',
    'Tokyo',
    'true',
    'Osaka',
    'false',
    'Kyoto',
    'false',
    'Yokohama',
    'false',
    'Geography;Asia',
    'Japan;Capitals',
  ];

  return [
    headers.join(','),
    sampleRow.map(value => `"${value}"`).join(','),
  ].join('\n');
}

export function exportQuestionsToCSV(questions: any[]): string {
  const headers = [
    'type',
    'text',
    'points',
    'difficulty',
    'hint',
    'explanation',
    'option1',
    'option1_correct',
    'option2',
    'option2_correct',
    'option3',
    'option3_correct',
    'option4',
    'option4_correct',
    'categories',
    'tags',
  ];

  const rows = questions.map(question => {
    const options = question.options || [];
    const categories =
      question.categories
        ?.map((c: any) => c.category?.name)
        .filter(Boolean)
        .join(';') || '';
    const tags =
      question.tags
        ?.map((t: any) => t.name)
        .filter(Boolean)
        .join(';') || '';

    return [
      question.type,
      question.text,
      question.points.toString(),
      question.difficulty,
      question.hint || '',
      question.explanation || '',
      options[0]?.text || '',
      options[0]?.isCorrect ? 'true' : 'false',
      options[1]?.text || '',
      options[1]?.isCorrect ? 'true' : 'false',
      options[2]?.text || '',
      options[2]?.isCorrect ? 'true' : 'false',
      options[3]?.text || '',
      options[3]?.isCorrect ? 'true' : 'false',
      categories,
      tags,
    ]
      .map(value => `"${value}"`)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
