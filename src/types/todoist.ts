/**
 * Tipi per l'API Todoist
 */

/**
 * Interfaccia per un progetto Todoist
 */
export interface TodoistProject {
  id: string;
  name: string;
  color?: string;
  // Altre proprietà che potrebbero essere presenti
  [key: string]: any;
}

/**
 * Interfaccia per un'attività Todoist
 */
export interface TodoistTask {
  id: string;
  content: string;
  projectId?: string;
  priority?: number;
  due?: {
    date: string;
    string: string;
    isRecurring: boolean;
  };
  labels?: string[];
  // Altre proprietà che potrebbero essere presenti
  [key: string]: any;
}

/**
 * Parametri per la creazione di un progetto
 */
export interface CreateProjectParams {
  name: string;
  color?: string;
  parentId?: string;
  // Altri parametri supportati
  [key: string]: any;
}

/**
 * Parametri per la creazione di un'attività
 */
export interface CreateTaskParams {
  content: string;
  projectId?: string;
  priority?: number;
  dueString?: string;
  dueDate?: string;
  labels?: string[];
  // Altri parametri supportati
  [key: string]: any;
} 