import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { setupHandlers } from './handlers/mcpHandlers.js';
import { getTodoistClient } from './utils/todoistClient.js';
import * as fs from 'fs';
import * as path from 'path';

export const logger = {
  logFile: path.join(process.cwd(), 'todoist-mcp-server.log'),
  _writeToFile(message: string) {
    try { fs.appendFileSync(this.logFile, message + '\n'); } catch (error) {}
  },
  info(message: string, ...args: any[]) {
    const formattedMessage = `[INFO] ${new Date().toISOString()} - ${message} ${args.length ? JSON.stringify(args) : ''}`;
    this._writeToFile(formattedMessage);
  },
  warn(message: string, ...args: any[]) {
    const formattedMessage = `[WARN] ${new Date().toISOString()} - ${message} ${args.length ? JSON.stringify(args) : ''}`;
    this._writeToFile(formattedMessage);
  },
  error(message: string, ...args: any[]) {
    const formattedMessage = `[ERROR] ${new Date().toISOString()} - ${message} ${args.length ? JSON.stringify(args) : ''}`;
    this._writeToFile(formattedMessage);
  }
};

const server = new Server(
  {
    name: "todoist-server",
    version: "0.1.0",
    description: "Server MCP per Todoist. Usa le RISORSE per leggere progetti e attività (todoist://...), e i TOOLS per creare/modificare/eliminare."
  },
  {
    capabilities: {
      resources: {
        list: true,
        read: true,
        write: false,
        delete: false,
        description: "Usa le risorse per leggere progetti e attività. Esempi: todoist://today/tasks, todoist://project/{id}, todoist://task/{id}"
      },
      tools: {
        description: "Usa i tools solo per operazioni di modifica come creare, completare o eliminare progetti e attività"
      },
      prompts: {},
    },
  }
);

logger.info("Initializing server...");

const args = process.argv.slice(2);
let apiToken: string | undefined;
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--token' || args[i] === '-t') && i + 1 < args.length) {
    apiToken = args[i + 1];
    break;
  }
}
const todoistClient = getTodoistClient(apiToken);
if (!todoistClient) {
  logger.warn("Il client Todoist non è inizializzato. Imposta TODOIST_API_TOKEN nel file .env o usa --token quando avvii il server");
}
setupHandlers(server);
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [{ name: "todoist_overview", description: "Genera un riepilogo dello stato di Todoist" }]
}));
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "todoist_overview") throw new Error("Prompt sconosciuto");
  return {
    messages: [{
      role: "user",
      content: { type: "text", text: "Genera un riepilogo dello stato attuale di Todoist, inclusi progetti e attività." }
    }]
  };
});

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => { transports[sid] = transport; },
      enableDnsRebindingProtection: false,
    });
    transport.onclose = () => {
      if (transport.sessionId) delete transports[transport.sessionId];
    };
    await server.connect(transport);
  }
  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  logger.info(`MCP Streamable HTTP server listening on port ${PORT}`);
}); 