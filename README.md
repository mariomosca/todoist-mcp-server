# 🚀 Advanced Todoist MCP Server

**A sophisticated Model Context Protocol (MCP) server for seamless Todoist integration with AI assistants like Claude**

This TypeScript-based MCP server enables advanced interaction with Todoist through the Model Context Protocol, allowing Claude and other LLMs to intelligently access, analyze, and manipulate your Todoist projects and tasks with unprecedented depth and flexibility.

🌐 **Portfolio Project**: This server showcases advanced MCP development expertise, TypeScript architecture, and AI-human workflow optimization for [mariomosca.com](https://mariomosca.com).

## ✨ Unique Features & Differentiators

### 🧠 **Intelligent Resource Discovery**
- **Hierarchical Project Navigation**: Automatic detection and mapping of project hierarchies with subprojects
- **Today's Tasks Optimization**: Dedicated resource for current day task management
- **Dynamic Resource Generation**: Real-time resource discovery based on your actual Todoist data
- **Context-Aware Descriptions**: Smart descriptions that understand project relationships

### 🔄 **Advanced State Management** 
- **Delta Detection System**: Track changes since last interaction (unique feature!)
- **Hierarchical Task Organization**: Understand and maintain project-task relationships
- **Structured Data Access**: JSON-formatted responses optimized for AI processing
- **Resource URI System**: Clean, RESTful-like URI structure (`todoist://project/{id}/tasks`)

### 🛠️ **Comprehensive Tool Suite**
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Smart Task Creation**: Natural language due dates and priority setting
- **Batch Operations**: Efficient handling of multiple tasks and projects
- **Error Handling**: Robust error management with detailed feedback
- **🆕 Completed Tasks Retrieval**: Access completed tasks via Sync API v9 with flexible date filtering

## 🏗️ **Advanced Architecture**

### **Modular Design Structure**
```
src/
├── handlers/
│   ├── mcpHandlers.ts    - Core MCP protocol handling
│   ├── projectHandler.ts - Advanced project management
│   └── taskHandler.ts    - Intelligent task operations
├── types/
│   └── todoist.ts        - TypeScript type definitions
├── utils/
│   └── todoistClient.ts  - Authenticated API client
└── index.ts              - Server initialization & logging
```

### **Smart Logging System**
- **File-Based Logging**: Non-intrusive logging that doesn't interfere with stdio communication
- **Detailed Request Tracking**: Complete audit trail of all operations
- **Performance Monitoring**: Execution time and resource usage tracking
- **Debug-Friendly**: Integrated with MCP Inspector for development

## 🎯 **Core Capabilities**

### **📚 Resources (Read Operations)**
| Resource URI | Description | Use Case |
|-------------|-------------|-----------|
| `todoist://today/tasks` | Today's scheduled tasks | Daily planning & focus |
| `todoist://project/{id}` | Project details & metadata | Project management |
| `todoist://project/{id}/tasks` | All tasks in specific project | Project task overview |
| `todoist://project/{id}/structure` | Complete project hierarchy | Complex project analysis |
| `todoist://task/{id}` | Individual task details | Task-specific operations |

### **🔧 Tools (Write Operations)**

#### **📖 Operazioni di Lettura**
- **`get_todoist_projects`** - Retrieve all projects with hierarchy
- **`get_todoist_tasks`** - Flexible task retrieval with filtering
  - Filter by project ID
  - Filter by "today" for current tasks
- **🆕 `get_completed_tasks`** - Retrieve completed tasks with custom filters:
  - Date range filtering (since/until in ISO 8601 format)
  - Project-specific filtering
  - Configurable result limits
- **🆕 `get_today_completed_tasks`** - Get all tasks completed today
- **🆕 `get_week_completed_tasks`** - Get all tasks completed this week (Sunday to Saturday)

#### **✏️ Operazioni di Creazione**
- **`create_todoist_project`** - Create new projects with color coding
- **`create_todoist_task`** - Advanced task creation with:
  - Natural language due dates
  - Priority levels (1-4)
  - Project assignment
  - Labels and descriptions

#### **🔄 Operazioni di Modifica**
- **`update_todoist_task`** - Update existing tasks with:
  - Content/title changes
  - Priority adjustments (1-4)
  - Due date modifications
  - Label management
  - Description updates
- **`move_todoist_task`** - Move tasks between:
  - Projects
  - Sections within projects
  - Create subtasks (parentId)
- **`update_todoist_project`** - Update project properties:
  - Project names
  - Color themes
  - Project hierarchy

#### **✅ Operazioni di Stato**
- **`complete_todoist_task`** - Mark tasks as completed
- **`reopen_todoist_task`** - Reopen completed tasks

#### **🗑️ Operazioni di Eliminazione**
- **`delete_todoist_project`** - Safe project deletion
- **`delete_todoist_task`** - Task removal with confirmation

## ⚙️ **Setup & Configuration**

### **Prerequisites**
- Node.js 16+ (recommended: Node.js 20+)
- Todoist Pro account (for API access)
- TypeScript 5.3+

### **Installation**

1. **Clone & Install**
```bash
git clone https://github.com/mariomosca/todoist-mcp-server.git
cd todoist-mcp-server
npm install
```

2. **API Token Configuration**

Get your Todoist API token from [Todoist Integration Settings](https://todoist.com/app/settings/integrations)

**Method 1: Environment File**
```bash
# Create .env file
echo "TODOIST_API_TOKEN=your_todoist_api_token_here" > .env
```

**Method 2: Command Line Token**
```bash
# Pass token as argument
node build/index.js --token your_todoist_api_token_here
```

3. **Build the Server**
```bash
npm run build
```

### **Claude Desktop Integration**

**macOS Configuration**: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "todoist-server": {
      "command": "/path/to/mcp-server-todoist/todoist-server/build/index.js",
      "args": ["--token", "your_todoist_api_token_here"]
    }
  }
}
```

**Windows Configuration**: `%APPDATA%/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "todoist-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-todoist/todoist-server/build/index.js", "--token", "your_todoist_api_token_here"]
    }
  }
}
```

## 🚀 **Development & Debugging**

### **Development Workflow**
```bash
# Watch mode with auto-compilation
npm run watch

# Build production version
npm run build

# Start with HTTP server (development only)
npm run start:http
```

### **Advanced Debugging**
Since MCP servers communicate via stdio, debugging requires special tools:

```bash
# Launch MCP Inspector
npm run inspector

# View logs in real-time
tail -f todoist-mcp-server.log
```

The Inspector provides a web-based interface for testing all server capabilities.

## 📖 **Usage Examples**

### **Daily Task Management**
```
Claude: "What tasks do I have today?"
→ Accesses todoist://today/tasks resource
→ Returns structured JSON with today's tasks
```

### **Completed Tasks Analysis**
```
Claude: "What did I complete today?"
→ Uses get_today_completed_tasks tool
→ Returns all tasks completed with timestamps

Claude: "Show me my productivity for this week"
→ Uses get_week_completed_tasks tool
→ Returns comprehensive weekly completion report
```

### **Custom Date Range Queries**
```
Claude: "What tasks did I complete between Feb 1-5?"
→ Uses get_completed_tasks with since/until parameters
→ Returns filtered completed tasks from specific period
```

### **Project Analysis**
```
Claude: "Show me the structure of my Work project"
→ Finds project ID for "Work"
→ Accesses todoist://project/{id}/structure
→ Returns hierarchical project view with subprojects
```

### **Smart Task Creation**
```
Claude: "Create a high-priority task 'Review quarterly reports' due tomorrow in Work project"
→ Uses create_todoist_task tool
→ Automatically sets priority=4, due="tomorrow", finds Work project ID
```

### **Batch Operations**
```
Claude: "Complete all tasks in my Personal project that are overdue"
→ Gets all Personal project tasks
→ Filters for overdue items
→ Completes each task individually
```

### **Advanced Task Management**
```
Claude: "Change the priority of task 'Review quarterly reports' to high and move it to tomorrow"
→ Updates task priority to 4
→ Changes due date to tomorrow
```

### **Task Organization**
```
Claude: "Move the task 'Buy groceries' from Personal to Shopping project"
→ Moves task to different project using move_todoist_task
```

### **Project Management**
```
Claude: "Rename my 'Work Stuff' project to 'Professional Tasks' and change color to blue"
→ Updates project name and color using update_todoist_project
```

## 🔬 **Technical Innovation**

### **What Makes This MCP Server Unique**

1. **🆕 Sync API v9 Integration**: Leverages Todoist Sync API for completed tasks retrieval - a feature not available in the standard REST API, enabling comprehensive productivity analytics.

2. **Delta Detection System**: Unlike other Todoist integrations, this server can track what changed since the last interaction, enabling intelligent sync and update operations.

2. **Hierarchical Resource Mapping**: Automatically understands and maps complex project hierarchies, providing both flat and structured views.

3. **Context-Aware AI Integration**: Designed specifically for AI interaction patterns, with optimized data structures and clear operation separation.

4. **Advanced Error Recovery**: Robust error handling that provides actionable feedback for both users and AI systems.

5. **Performance Optimization**: Efficient API usage with smart caching and batch operation support.

6. **Complete Task Lifecycle Management**: Full CRUD operations including advanced update and move capabilities not commonly found in other Todoist integrations.

7. **Flexible Task Organization**: Support for moving tasks between projects, sections, and creating subtasks with parent-child relationships.

8. **Project Management Integration**: Bidirectional project updates allowing AI assistants to reorganize and maintain project structures dynamically.

## 🎯 **AI Pair Programming Excellence**

This project demonstrates advanced **AI-Human Collaboration Methodology**:

- **Human Architecture**: Strategic decisions, API design, and system architecture
- **AI Implementation**: Accelerated coding, pattern implementation, and optimization
- **Collaborative Testing**: Combined human insight and AI-powered edge case detection
- **Iterative Refinement**: Continuous improvement through AI-assisted code review

## 🔮 **Roadmap & Extensions**

### **Recently Completed** ✅
- [x] **Completed Tasks Support**: Full integration with Sync API v9 for retrieving completed tasks
- [x] **Productivity Analytics**: Today and weekly completed task tracking
- [x] **Custom Date Ranges**: Flexible filtering for completed tasks analysis

### **Planned Features**
- [ ] **Label Management**: Full support for Todoist labels and filters  
- [ ] **Section Support**: Project section creation and management
- [ ] **Advanced Search**: Natural language task and project search
- [x] **Analytics Integration**: Task completion statistics and productivity insights (basic version completed)
- [ ] **Webhook Support**: Real-time notifications and sync
- [ ] **Multi-Account Support**: Handle multiple Todoist accounts

### **Integration Opportunities**  
- **Calendar Sync**: Integration with calendar MCP servers
- **Note-Taking**: Connection with knowledge management systems
- **Time Tracking**: Integration with time tracking MCP servers
- **Email Integration**: Task creation from email content

## 🏆 **Portfolio Showcase**

This MCP server showcases expertise in:

- **Advanced TypeScript Development**: Complex type systems and async patterns
- **API Integration Architecture**: RESTful API consumption and state management  
- **Protocol Implementation**: Model Context Protocol specification compliance
- **Error Handling & Logging**: Production-ready monitoring and debugging
- **Developer Experience**: Comprehensive tooling and documentation
- **AI-Human Workflow Design**: Optimized for AI assistant interaction patterns

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 **Contributing**

Contributions welcome! Please read our contributing guidelines and submit pull requests for any improvements.

---

**Built with ❤️ by [Mario Mosca](https://mariomosca.com) - Showcasing the future of AI-human productivity collaboration**