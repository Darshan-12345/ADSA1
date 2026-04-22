# AetherDocs | Intelligent File Search Engine

Full-stack document discovery dashboard with a React frontend and a modular C++ backend.

## Features

- Modern React dashboard with search, autocomplete, file preview, responsive panels, and right-click actions.
- C++ backend with inverted index, trie, DFS traversal, adjacency-list graph, and min-heap expiry management.
- JSON REST endpoints for scan, search, autocomplete, structure, related files, and temp file management.

## Project Structure

```text
ADSA1/
|-- backend/                 C++ server and search engine logic
|   |-- include/             Header files for models, JSON helpers, and search engine interfaces
|   |-- src/                 Main server entry point and core search engine implementation
|   `-- CMakeLists.txt       Build configuration for the backend
|
|-- frontend/                React + Vite user interface
|   |-- public/              Static assets served as-is
|   |-- src/                 Application code
|   |   |-- components/      Reusable UI building blocks
|   |   |-- context/         Shared React state/providers
|   |   |-- hooks/           Custom React hooks
|   |   |-- layout/          Page shell and layout structure
|   |   |-- pages/           Route-level screens
|   |   `-- utils/           Frontend helper functions
|   |-- package.json         Frontend dependencies and scripts
|   `-- vite.config.js       Vite development/build configuration
|
|-- sample_data/             Example files used for indexing and search demos
`-- README.md                Project overview and setup guide
```

### Folder Guide

- `backend/` powers the indexing, search, autocomplete, and file-relationship APIs.
- `frontend/` is the visual dashboard where users search, browse, and preview documents.
- `sample_data/` gives you a ready-made dataset to test the engine without creating files manually.

Note: generated folders like `frontend/node_modules/`, `frontend/dist/`, and `backend/smart_document_server.exe` are build/runtime artifacts, so they are usually not shown in the main structure diagram.

## Run Backend

```powershell
cd backend
g++ -std=c++17 -Iinclude src/main.cpp src/SearchEngine.cpp -lws2_32 -o smart_document_server.exe
.\smart_document_server.exe
```

## Run Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

The frontend expects the backend at `http://localhost:18080`.
