# Code Examples and Syntax Highlighting

Comprehensive examples showcasing the markdown viewer's syntax highlighting capabilities across multiple programming languages.

## JavaScript and TypeScript

### Basic JavaScript

The markdown viewer supports syntax highlighting for JavaScript with full support for ES6+ features:

```javascript
// Example: Fetching data with async/await
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user = await response.json();
    console.log('User data:', user);
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error.message);
    throw error;
  }
}

// Usage
const user = await fetchUserData(123);
```

### TypeScript with Types

TypeScript code blocks highlight type annotations, interfaces, and generics:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

class UserRepository {
  private users: Map<number, User> = new Map();
  private nextId: number = 1;

  addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  getUserById(id: number): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  deleteUser(id: number): boolean {
    return this.users.delete(id);
  }
}

// Generic function example
function createArray<T>(length: number, fillValue: T): T[] {
  return new Array(length).fill(fillValue);
}
```

## Python Examples

### Data Processing

Python code blocks display with proper indentation highlighting:

```python
import pandas as pd
import numpy as np
from typing import List, Dict, Optional

class DataProcessor:
    """Handle data cleaning and transformation."""

    def __init__(self, data_path: str):
        self.data = pd.read_csv(data_path)
        self.processed = False

    def clean_data(self) -> None:
        """Remove null values and duplicates."""
        self.data = self.data.dropna()
        self.data = self.data.drop_duplicates()
        self.processed = True

    def aggregate_by_category(self, column: str) -> Dict[str, float]:
        """Group data by category and calculate mean."""
        if not self.processed:
            self.clean_data()

        grouped = self.data.groupby(column)['value'].mean()
        return grouped.to_dict()

    def get_statistics(self) -> Dict[str, any]:
        """Calculate descriptive statistics."""
        return {
            'count': len(self.data),
            'mean': self.data['value'].mean(),
            'std': self.data['value'].std(),
            'min': self.data['value'].min(),
            'max': self.data['value'].max(),
        }

# Usage example
processor = DataProcessor('data.csv')
stats = processor.get_statistics()
print(f"Dataset statistics: {stats}")
```

## Rust Examples

### Memory Safety and Ownership

Rust highlighting shows the language's unique syntax:

```rust
use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone)]
struct Task {
    id: u32,
    title: String,
    completed: bool,
}

struct TaskManager {
    tasks: HashMap<u32, Task>,
    next_id: u32,
}

impl TaskManager {
    fn new() -> Self {
        TaskManager {
            tasks: HashMap::new(),
            next_id: 1,
        }
    }

    fn add_task(&mut self, title: String) -> u32 {
        let task = Task {
            id: self.next_id,
            title,
            completed: false,
        };

        self.tasks.insert(self.next_id, task);
        self.next_id += 1;
        self.next_id - 1
    }

    fn complete_task(&mut self, id: u32) -> Result<(), String> {
        match self.tasks.get_mut(&id) {
            Some(task) => {
                task.completed = true;
                Ok(())
            }
            None => Err(format!("Task {} not found", id)),
        }
    }

    fn list_tasks(&self) -> Vec<&Task> {
        self.tasks.values().collect()
    }
}

fn main() {
    let mut manager = TaskManager::new();
    manager.add_task("Learn Rust".to_string());
    manager.add_task("Build a project".to_string());

    let _ = manager.complete_task(1);

    for task in manager.list_tasks() {
        println!("{:?}", task);
    }
}
```

## Go Examples

### Concurrency and Interfaces

Go code with goroutines and channels:

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Worker interface {
    Work(job string) error
    Status() string
}

type DefaultWorker struct {
    name string
    mu   sync.Mutex
}

func (w *DefaultWorker) Work(job string) error {
    w.mu.Lock()
    defer w.mu.Unlock()

    fmt.Printf("%s is working on: %s\n", w.name, job)
    time.Sleep(time.Second)
    return nil
}

func (w *DefaultWorker) Status() string {
    w.mu.Lock()
    defer w.mu.Unlock()
    return fmt.Sprintf("Worker %s is ready", w.name)
}

func WorkerPool(jobs chan string, workers []Worker) {
    for job := range jobs {
        worker := workers[len(workers)%len(workers)]
        go worker.Work(job)
    }
}

func main() {
    jobs := make(chan string, 10)
    workers := []Worker{
        &DefaultWorker{name: "Worker 1"},
        &DefaultWorker{name: "Worker 2"},
        &DefaultWorker{name: "Worker 3"},
    }

    go WorkerPool(jobs, workers)

    for i := 1; i <= 6; i++ {
        jobs <- fmt.Sprintf("Job %d", i)
    }

    time.Sleep(time.Second * 10)
}
```

## HTML and CSS

### Frontend Markup

HTML structure with nested elements:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Viewer Demo</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="navbar">
        <nav class="container">
            <div class="logo">md</div>
            <ul class="nav-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#themes">Themes</a></li>
                <li><a href="#docs">Documentation</a></li>
            </ul>
        </nav>
    </header>

    <main class="content">
        <section id="hero" class="hero">
            <h1>Terminal Markdown Viewer</h1>
            <p>Beautiful markdown rendering in your terminal</p>
            <button class="btn btn-primary">Get Started</button>
        </section>

        <section id="features" class="features">
            <div class="feature-grid">
                <article class="feature-card">
                    <h3>Syntax Highlighting</h3>
                    <p>70+ programming languages with theme-matched colors</p>
                </article>
                <article class="feature-card">
                    <h3>31+ Themes</h3>
                    <p>Choose from popular color schemes like Dracula and Catppuccin</p>
                </article>
                <article class="feature-card">
                    <h3>Smart Wrapping</h3>
                    <p>Intelligent text wrapping with optional hyphenation</p>
                </article>
            </div>
        </section>
    </main>
</body>
</html>
```

### CSS Styling

```css
:root {
    --color-primary: #1e66f5;
    --color-secondary: #04a5e5;
    --color-background: #eff1f5;
    --color-text: #4c4f69;
    --color-border: #bcc0cc;
    --spacing-unit: 0.5rem;
}

body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu;
    color: var(--color-text);
    background-color: var(--color-background);
}

.navbar {
    background: white;
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 100;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--color-primary);
}

.nav-links {
    list-style: none;
    display: flex;
    gap: calc(var(--spacing-unit) * 2);
}

.nav-links a {
    text-decoration: none;
    color: var(--color-text);
    transition: color 0.2s;
}

.nav-links a:hover {
    color: var(--color-primary);
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: calc(var(--spacing-unit) * 3);
    margin-top: calc(var(--spacing-unit) * 2);
}

.feature-card {
    padding: calc(var(--spacing-unit) * 2);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    transition: all 0.3s;
}

.feature-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}
```

## SQL Examples

### Database Queries

```sql
-- Create tables for a content management system
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complex query with joins and aggregation
SELECT
    u.username,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as latest_post,
    AVG(p.created_at) as avg_post_date
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE p.published = TRUE
    AND p.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.username
HAVING COUNT(p.id) > 0
ORDER BY post_count DESC
LIMIT 10;

-- Insert with returning clause
INSERT INTO users (username, email, password_hash)
VALUES ('newuser', 'newuser@example.com', 'hashed_password')
RETURNING id, username, created_at;
```

## Docker

### Containerization Example

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Build TypeScript
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run application
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## Bash and Shell Scripts

### System Administration

```bash
#!/bin/bash

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONFIG_DIR="${HOME}/.config/md"
CONFIG_FILE="${CONFIG_DIR}/config.toml"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create config directory if it doesn't exist
if [[ ! -d "$CONFIG_DIR" ]]; then
    log_info "Creating config directory: $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"
fi

# Check if config exists
if [[ ! -f "$CONFIG_FILE" ]]; then
    log_warn "Configuration file not found. Creating default config..."
    cat > "$CONFIG_FILE" <<EOF
theme = "frappe"
width = "auto"
truecolor = "auto"
nerd_fonts = "auto"

[display]
padding = true
maxWidth = 0

[code]
wrap = true
continuation = "→"
EOF
    log_info "Default configuration created at: $CONFIG_FILE"
else
    log_info "Configuration file exists at: $CONFIG_FILE"
fi

# Validate configuration
if grep -q 'theme = ' "$CONFIG_FILE"; then
    THEME=$(grep 'theme = ' "$CONFIG_FILE" | cut -d'"' -f2)
    log_info "Using theme: $THEME"
else
    log_error "Invalid configuration file"
    exit 1
fi

log_info "Setup complete!"
```

## JSON Configuration

### Configuration Files

```json
{
  "name": "markdown-display",
  "version": "0.3.2",
  "description": "Terminal markdown viewer",
  "type": "module",
  "bin": {
    "md": "./dist/index.js"
  },
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "bun build src/index.ts --outfile dist/index.js --minify",
    "lint": "biome lint src/",
    "format": "biome format src/",
    "check": "biome check src/",
    "tc": "tsc --noEmit"
  },
  "keywords": [
    "markdown",
    "terminal",
    "viewer",
    "cli",
    "syntax-highlighting"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "marked": "^11.0.0",
    "shiki": "^0.14.0",
    "hyphen": "^1.18.0"
  },
  "devDependencies": {
    "@biomejs/biome": "latest",
    "typescript": "^5.0.0"
  }
}
```

## YAML Configuration

### Service Configuration

```yaml
version: '3.8'

services:
  markdown-viewer:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: markdown-viewer
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - CONFIG_PATH=/etc/markdown-viewer/config.toml
    volumes:
      - ./config.toml:/etc/markdown-viewer/config.toml:ro
      - ./docs:/app/docs:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: markdown-viewer-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - markdown-viewer
    restart: unless-stopped
```

## Summary

The markdown viewer supports syntax highlighting for:

- JavaScript, TypeScript, and JSX
- Python and other scripting languages
- Compiled languages like Rust, Go, C++, Java
- Web technologies: HTML, CSS, XML
- Data formats: JSON, YAML, TOML
- Database languages: SQL
- Infrastructure: Dockerfile, Docker Compose
- And 50+ more languages!

Each code block is rendered with proper indentation, color highlighting, and line wrapping to provide an excellent reading experience in the terminal.
