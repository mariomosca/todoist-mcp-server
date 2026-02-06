/**
 * Handler MCP per l'interazione con Todoist
 */
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import * as projectHandler from './projectHandler.js';
import * as taskHandler from './taskHandler.js';
import { CreateProjectParams, CreateTaskParams, UpdateTaskParams, MoveTaskParams, GetCompletedTasksParams } from '../types/todoist.js';
import { logger } from '../index.js';

/**
 * Configura gli handler per il server MCP
 * @param server Istanza del server MCP
 */
export function setupHandlers(server: Server) {
  // Handler per elencare le risorse disponibili (progetti e attività)
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.info("Inizio recupero risorse");
    
    let resources: Array<{
      uri: string;
      mimeType: string;
      name: string;
      description: string;
    }> = [];

    // Aggiungi la risorsa "Attività di oggi"
    resources.push({
      uri: "todoist://today/tasks",
      mimeType: "application/json",
      name: "Attività di oggi",
      description: "Tutte le attività in scadenza oggi"
    });

    // Aggiungi progetti come risorse
    logger.info("Recupero progetti...");
    const projects = await projectHandler.getProjects();
    if (projects && projects.length > 0) {
      logger.info(`Trovati ${projects.length} progetti`);
      
      // Funzione per costruire la gerarchia dei progetti
      const buildProjectHierarchy = (projects: any[], parentId: string | null = null): any[] => {
        return projects
          .filter(project => project.parentId === parentId)
          .flatMap(project => {
            const children = buildProjectHierarchy(projects, project.id);
            const resources = [
              // Risorsa del progetto
              {
                uri: `todoist://project/${project.id}`,
                mimeType: "application/json",
                name: project.name,
                description: `Progetto Todoist: ${project.name}${parentId ? ' (sottoprogetto)' : ''}`
              },
              // Risorsa per i task del progetto
              {
                uri: `todoist://project/${project.id}/tasks`,
                mimeType: "application/json",
                name: `📝 Task di ${project.name}`,
                description: `Elenco delle attività nel progetto ${project.name}`
              }
            ];

            // Se ci sono progetti figli, aggiungiamo una risorsa per visualizzare la struttura completa
            if (children.length > 0) {
              resources.push({
                uri: `todoist://project/${project.id}/structure`,
                mimeType: "application/json",
                name: `📂 Struttura di ${project.name}`,
                description: `Struttura completa del progetto ${project.name} con sottoprogetti`
              });
            }

            return [...resources, ...children];
          });
      };

      const projectResources = buildProjectHierarchy(projects);
      resources = [...resources, ...projectResources];
    } else {
      logger.info("Nessun progetto trovato");
    }

    // Aggiungi attività come risorse
    logger.info("Recupero attività...");
    const tasks = await taskHandler.getTasks();
    if (tasks && tasks.length > 0) {
      logger.info(`Trovate ${tasks.length} attività`);
      const taskResources = tasks.map((task) => ({
        uri: `todoist://task/${task.id}`,
        mimeType: "application/json",
        name: task.content,
        description: `Attività Todoist: ${task.content}`
      }));
      resources = [...resources, ...taskResources];
    } else {
      logger.info("Nessuna attività trovata");
    }

    logger.info(`Restituzione di ${resources.length} risorse totali`);
    return { resources };
  });

  // Handler per leggere i contenuti di progetti e attività
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    // Gestiamo manualmente l'URL poiché URL API non supporta protocolli personalizzati
    const uri = request.params.uri;
    if (!uri.startsWith('todoist://')) {
      throw new Error(`Protocollo non supportato: ${uri}`);
    }

    // Rimuoviamo il protocollo e gestiamo il path
    const path = uri.replace('todoist://', '').replace(/^\/+/, '').replace(/\/+$/, '');
    if (!path) {
      throw new Error('Percorso mancante');
    }

    const pathParts = path.split('/');
    const resourceType = pathParts[0];

    logger.info("Elaborazione richiesta risorsa", { uri, path, pathParts, resourceType });
    
    // Gestione speciale per le attività di oggi
    if (resourceType === 'today') {
      if (pathParts[1] !== 'tasks') {
        throw new Error(`Percorso non valido per today: ${path}`);
      }
      const tasks = await taskHandler.getTodayTasks();
      if (!tasks) {
        throw new Error("Errore nel recupero delle attività di oggi");
      }
      
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(tasks, null, 2)
        }]
      };
    }

    // Verifica che ci sia almeno un ID per le altre risorse
    if (pathParts.length < 2) {
      throw new Error(`Percorso non valido: ${path}`);
    }
    
    const resourceId = pathParts[1];
    
    // Ottieni dettagli progetto
    if (resourceType === 'project') {
      const project = await projectHandler.getProject(resourceId);
      if (!project) {
        throw new Error(`Progetto non trovato: ${resourceId}`);
      }
      
      // Se richiesta la struttura completa del progetto
      if (pathParts.length > 2 && pathParts[2] === 'structure') {
        const allProjects = await projectHandler.getProjects();
        if (!allProjects) {
          throw new Error("Impossibile recuperare la lista dei progetti");
        }
        
        // Funzione ricorsiva per costruire la struttura
        const buildStructure = (projectId: string): any => {
          const currentProject = allProjects.find(p => p.id === projectId);
          if (!currentProject) return null;
          
          const children = allProjects
            .filter(p => p.parentId === projectId)
            .map(p => buildStructure(p.id))
            .filter(p => p !== null);
          
          return {
            ...currentProject,
            children: children.length > 0 ? children : undefined
          };
        };
        
        const structure = buildStructure(resourceId);
        
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(structure, null, 2)
          }]
        };
      }
      
      // Se c'è un terzo elemento nel percorso, potrebbe essere una richiesta per le attività del progetto
      if (pathParts.length > 2 && pathParts[2] === 'tasks') {
        const tasks = await taskHandler.getTasksByProject(resourceId);
        
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify({ project, tasks }, null, 2)
          }]
        };
      }
      
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(project, null, 2)
        }]
      };
    }
    
    // Ottieni dettagli attività
    if (resourceType === 'task') {
      const task = await taskHandler.getTask(resourceId);
      if (!task) {
        throw new Error(`Attività non trovata: ${resourceId}`);
      }
      
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(task, null, 2)
        }]
      };
    }
    
    throw new Error(`Tipo di risorsa non supportato: ${resourceType}`);
  });

  // Handler per elencare gli strumenti disponibili
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info("Richiesta di elenco tools ricevuta");
    const toolResponse = {
      tools: [
        // Tool di lettura per progetti
        {
          name: "get_todoist_projects",
          description: "Recupera l'elenco dei progetti Todoist disponibili",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        
        // Tool di lettura per task
        {
          name: "get_todoist_tasks",
          description: "Recupera l'elenco delle attività Todoist",
          inputSchema: {
            type: "object",
            properties: {
              projectId: {
                type: "string",
                description: "Filtra le attività per ID progetto (opzionale)"
              },
              filter: {
                type: "string",
                description: "Filtra per 'today' per vedere solo le attività di oggi (opzionale)"
              }
            }
          }
        },
        
        // Strumento per creare un progetto
        {
          name: "create_todoist_project",
          description: "Crea un nuovo progetto su Todoist",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Nome del progetto"
              },
              color: {
                type: "string",
                description: "Colore del progetto (opzionale)"
              }
            },
            required: ["name"]
          }
        },
        
        // Strumento per creare un'attività
        {
          name: "create_todoist_task",
          description: "Crea una nuova attività su Todoist",
          inputSchema: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "Contenuto dell'attività"
              },
              projectId: {
                type: "string",
                description: "ID del progetto a cui appartiene l'attività (opzionale)"
              },
              dueString: {
                type: "string",
                description: "Scadenza in formato stringa (es. 'domani', 'oggi', ecc.) (opzionale)"
              },
              priority: {
                type: "number",
                description: "Priorità dell'attività (1-4, dove 4 è la priorità più alta) (opzionale)"
              }
            },
            required: ["content"]
          }
        },
        
        // Strumento per completare un'attività
        {
          name: "complete_todoist_task",
          description: "Completa un'attività esistente su Todoist",
          inputSchema: {
            type: "object",
            properties: {
              taskId: {
                type: "string",
                description: "ID dell'attività da completare"
              }
            },
            required: ["taskId"]
          }
        },
        
        // Strumento per eliminare un progetto
        {
          name: "delete_todoist_project",
          description: "Elimina un progetto esistente su Todoist",
          inputSchema: {
            type: "object",
            properties: {
              projectId: {
                type: "string",
                description: "ID del progetto da eliminare"
              }
            },
            required: ["projectId"]
          }
        },
        
        // Strumento per eliminare un'attività
        {
          name: "delete_todoist_task",
          description: "Elimina un'attività esistente su Todoist",
          inputSchema: {
            type: "object",
            properties: {
              taskId: {
                type: "string",
                description: "ID dell'attività da eliminare"
              }
            },
            required: ["taskId"]
          }
        },

        // Strumento per aggiornare un'attività
        {
          name: "update_todoist_task",
          description: "Aggiorna un'attività esistente su Todoist (titolo, priorità, date, ecc.)",
          inputSchema: {
            type: "object",
            properties: {
              taskId: {
                type: "string",
                description: "ID dell'attività da aggiornare"
              },
              content: {
                type: "string",
                description: "Nuovo titolo dell'attività (opzionale)"
              },
              priority: {
                type: "number",
                description: "Nuova priorità dell'attività (1-4) (opzionale)"
              },
              dueString: {
                type: "string",
                description: "Nuova data scadenza in formato stringa (es. 'domani', 'fra 3 giorni') (opzionale)"
              },
              labels: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Nuovi tag/labels per l'attività (opzionale)"
              }
            },
            required: ["taskId"]
          }
        },

        // Strumento per spostare un'attività
        {
          name: "move_todoist_task",
          description: "Sposta un'attività in un progetto, sezione o come sotto-attività",
          inputSchema: {
            type: "object",
            properties: {
              taskId: {
                type: "string",
                description: "ID dell'attività da spostare"
              },
              projectId: {
                type: "string",
                description: "ID del progetto di destinazione (opzionale)"
              },
              sectionId: {
                type: "string",
                description: "ID della sezione di destinazione (opzionale)"
              },
              parentId: {
                type: "string",
                description: "ID del task genitore se si vuole creare una sotto-attività (opzionale)"
              }
            },
            required: ["taskId"]
          }
        },

        // Strumento per riaprire un'attività
        {
          name: "reopen_todoist_task",
          description: "Riapre un'attività completata su Todoist",
          inputSchema: {
            type: "object",
            properties: {
              taskId: {
                type: "string",
                description: "ID dell'attività da riaprire"
              }
            },
            required: ["taskId"]
          }
        },

        // Strumento per recuperare le attività completate
        {
          name: "get_completed_tasks",
          description: "Recupera le attività completate in un intervallo di date specifico",
          inputSchema: {
            type: "object",
            properties: {
              since: {
                type: "string",
                description: "Data di inizio in formato ISO 8601 (es. '2026-02-06T00:00:00Z')"
              },
              until: {
                type: "string",
                description: "Data di fine in formato ISO 8601 (es. '2026-02-06T23:59:59Z')"
              },
              projectId: {
                type: "string",
                description: "Filtra per ID progetto (opzionale)"
              },
              limit: {
                type: "number",
                description: "Numero massimo di risultati (opzionale)"
              }
            }
          }
        },

        // Strumento per recuperare le attività completate oggi
        {
          name: "get_today_completed_tasks",
          description: "Recupera tutte le attività completate oggi",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },

        // Strumento per recuperare le attività completate questa settimana
        {
          name: "get_week_completed_tasks",
          description: "Recupera tutte le attività completate questa settimana (da domenica a sabato)",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },

        // Strumento per aggiornare un progetto
        {
          name: "update_todoist_project",
          description: "Aggiorna un progetto esistente su Todoist (nome, colore, ecc.)",
          inputSchema: {
            type: "object",
            properties: {
              projectId: {
                type: "string",
                description: "ID del progetto da aggiornare"
              },
              name: {
                type: "string",
                description: "Nuovo nome del progetto (opzionale)"
              },
              color: {
                type: "string",
                description: "Nuovo colore del progetto (opzionale)"
              }
            },
            required: ["projectId"]
          }
        }
      ]
    };
    return toolResponse;
  });

  // Handler per eseguire gli strumenti
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      // Gestione lettura progetti
      case "get_todoist_projects": {
        logger.info("Richiesta elenco progetti");
        const projects = await projectHandler.getProjects();
        if (!projects) {
          throw new Error("Errore nel recupero dei progetti");
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(projects, null, 2)
          }]
        };
      }
      
      // Gestione lettura tasks
      case "get_todoist_tasks": {
        const projectId = String(request.params.arguments?.projectId || "");
        const filter = String(request.params.arguments?.filter || "");
        
        logger.info(`Richiesta elenco attività con filtro: ${filter}, projectId: ${projectId}`);
        
        let tasks;
        if (filter === "today") {
          tasks = await taskHandler.getTodayTasks();
        } else if (projectId) {
          tasks = await taskHandler.getTasksByProject(projectId);
        } else {
          tasks = await taskHandler.getTasks();
        }
        
        if (!tasks) {
          throw new Error("Errore nel recupero delle attività");
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(tasks, null, 2)
          }]
        };
      }
      
      // Gestione creazione progetto
      case "create_todoist_project": {
        const params = request.params.arguments as unknown as CreateProjectParams;
        
        if (!params.name) {
          throw new Error("Il nome del progetto è obbligatorio");
        }

        const newProject = await projectHandler.createProject(params);
        if (!newProject) {
          throw new Error("Errore nella creazione del progetto");
        }

        return {
          content: [{
            type: "text",
            text: `Creato progetto Todoist: ${newProject.name} (ID: ${newProject.id})`
          }]
        };
      }
      
      // Gestione creazione attività
      case "create_todoist_task": {
        const params = request.params.arguments as unknown as CreateTaskParams;
        
        if (!params.content) {
          throw new Error("Il contenuto dell'attività è obbligatorio");
        }

        const newTask = await taskHandler.createTask(params);
        if (!newTask) {
          throw new Error("Errore nella creazione dell'attività");
        }

        return {
          content: [{
            type: "text",
            text: `Creata attività Todoist: ${newTask.content} (ID: ${newTask.id})`
          }]
        };
      }
      
      // Gestione completamento attività
      case "complete_todoist_task": {
        const taskId = String(request.params.arguments?.taskId);
        
        if (!taskId) {
          throw new Error("L'ID dell'attività è obbligatorio");
        }

        const success = await taskHandler.completeTask(taskId);
        if (!success) {
          throw new Error(`Errore nel completamento dell'attività ${taskId}`);
        }

        return {
          content: [{
            type: "text",
            text: `Attività ${taskId} completata con successo`
          }]
        };
      }
      
      // Gestione eliminazione progetto
      case "delete_todoist_project": {
        const projectId = String(request.params.arguments?.projectId);
        
        if (!projectId) {
          throw new Error("L'ID del progetto è obbligatorio");
        }

        const success = await projectHandler.deleteProject(projectId);
        if (!success) {
          throw new Error(`Errore nell'eliminazione del progetto ${projectId}`);
        }

        return {
          content: [{
            type: "text",
            text: `Progetto ${projectId} eliminato con successo`
          }]
        };
      }
      
      // Gestione eliminazione attività
      case "delete_todoist_task": {
        const taskId = String(request.params.arguments?.taskId);

        if (!taskId) {
          throw new Error("L'ID dell'attività è obbligatorio");
        }

        const success = await taskHandler.deleteTask(taskId);
        if (!success) {
          throw new Error(`Errore nell'eliminazione dell'attività ${taskId}`);
        }

        return {
          content: [{
            type: "text",
            text: `Attività ${taskId} eliminata con successo`
          }]
        };
      }

      // Gestione aggiornamento attività
      case "update_todoist_task": {
        const taskId = String(request.params.arguments?.taskId);
        const updateParams: UpdateTaskParams = {};

        if (!taskId) {
          throw new Error("L'ID dell'attività è obbligatorio");
        }

        // Aggiungiamo solo i parametri forniti
        if (request.params.arguments?.content) {
          updateParams.content = String(request.params.arguments.content);
        }
        if (request.params.arguments?.priority) {
          updateParams.priority = Number(request.params.arguments.priority);
        }
        if (request.params.arguments?.dueString) {
          updateParams.dueString = String(request.params.arguments.dueString);
        }
        if (request.params.arguments?.labels) {
          updateParams.labels = request.params.arguments.labels as string[];
        }

        const updatedTask = await taskHandler.updateTask(taskId, updateParams);
        if (!updatedTask) {
          throw new Error(`Errore nell'aggiornamento dell'attività ${taskId}`);
        }

        return {
          content: [{
            type: "text",
            text: `Attività ${taskId} aggiornata con successo: ${updatedTask.content}`
          }]
        };
      }

      // Gestione spostamento attività
      case "move_todoist_task": {
        const taskId = String(request.params.arguments?.taskId);
        const moveParams: MoveTaskParams = {};

        if (!taskId) {
          throw new Error("L'ID dell'attività è obbligatorio");
        }

        // Aggiungiamo solo i parametri forniti (deve essere solo uno dei tre)
        if (request.params.arguments?.projectId) {
          moveParams.projectId = String(request.params.arguments.projectId);
        }
        if (request.params.arguments?.sectionId) {
          moveParams.sectionId = String(request.params.arguments.sectionId);
        }
        if (request.params.arguments?.parentId) {
          moveParams.parentId = String(request.params.arguments.parentId);
        }

        const movedTask = await taskHandler.moveTask(taskId, moveParams);
        if (!movedTask) {
          throw new Error(`Errore nello spostamento dell'attività ${taskId}`);
        }

        return {
          content: [{
            type: "text",
            text: `Attività ${taskId} spostata con successo nel progetto ${movedTask.projectId}`
          }]
        };
      }

      // Gestione riapertura attività
      case "reopen_todoist_task": {
        const taskId = String(request.params.arguments?.taskId);

        if (!taskId) {
          throw new Error("L'ID dell'attività è obbligatorio");
        }

        const success = await taskHandler.reopenTask(taskId);
        if (!success) {
          throw new Error(`Errore nella riapertura dell'attività ${taskId}`);
        }

        return {
          content: [{
            type: "text",
            text: `Attività ${taskId} riaperta con successo`
          }]
        };
      }

      // Gestione recupero attività completate con filtro
      case "get_completed_tasks": {
        const params: GetCompletedTasksParams = {};

        if (request.params.arguments?.since) {
          params.since = String(request.params.arguments.since);
        }
        if (request.params.arguments?.until) {
          params.until = String(request.params.arguments.until);
        }
        if (request.params.arguments?.projectId) {
          params.projectId = String(request.params.arguments.projectId);
        }
        if (request.params.arguments?.limit) {
          params.limit = Number(request.params.arguments.limit);
        }

        const tasks = await taskHandler.getCompletedTasks(params);
        if (!tasks) {
          throw new Error("Errore nel recupero delle attività completate");
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(tasks, null, 2)
          }]
        };
      }

      // Gestione recupero attività completate oggi
      case "get_today_completed_tasks": {
        const tasks = await taskHandler.getTodayCompletedTasks();
        if (!tasks) {
          throw new Error("Errore nel recupero delle attività completate oggi");
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(tasks, null, 2)
          }]
        };
      }

      // Gestione recupero attività completate questa settimana
      case "get_week_completed_tasks": {
        const tasks = await taskHandler.getWeekCompletedTasks();
        if (!tasks) {
          throw new Error("Errore nel recupero delle attività completate questa settimana");
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(tasks, null, 2)
          }]
        };
      }

      // Gestione aggiornamento progetto
      case "update_todoist_project": {
        const projectId = String(request.params.arguments?.projectId);
        const updateParams: { name?: string; color?: string } = {};

        if (!projectId) {
          throw new Error("L'ID del progetto è obbligatorio");
        }

        // Aggiungiamo solo i parametri forniti
        if (request.params.arguments?.name) {
          updateParams.name = String(request.params.arguments.name);
        }
        if (request.params.arguments?.color) {
          updateParams.color = String(request.params.arguments.color);
        }

        const updatedProject = await projectHandler.updateProject(projectId, updateParams);
        if (!updatedProject) {
          throw new Error(`Errore nell'aggiornamento del progetto ${projectId}`);
        }

        return {
          content: [{
            type: "text",
            text: `Progetto ${projectId} aggiornato con successo: ${updatedProject.name}`
          }]
        };
      }

      default:
        throw new Error(`Strumento sconosciuto: ${request.params.name}`);
    }
  });
} 