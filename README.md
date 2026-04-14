# Milwaukee Tool Tracker — ONE-KEY EMEA

> A centralized tool tracking system for managing sample units across European demo accounts.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.1-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## What Is This?

When a company develops new products, physical samples need to travel between countries for testing and demos. This app keeps track of **where each tool is** and **who has it** — like a simple inventory system with a logbook.

- **Warehouse** = The central storage where all samples start
- **Demo Account** = A country-specific testing room (Germany, France, Spain, etc.)
- **Transfer** = Moving a tool from the warehouse to a country for demonstrations

## Quick Start (Under 5 Minutes)

### Prerequisites

- Python 3.10 or higher
- A modern web browser

### 1. Set up the Back-End

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API will start on `http://localhost:5000`.

### 2. Open the Front-End

Open a second terminal and start a simple HTTP server:

```bash
cd frontend
python -m http.server 3000
```

Then open `http://localhost:3000` in your browser.

### 3. Log In

Use these demo credentials:

| Account | Client ID | Client Secret |
|---------|-----------|---------------|
| Warehouse (Admin) | `demo_user` | `secret123` |
| France Demo | `france_demo` | `france123` |
| Germany Demo | `germany_demo` | `germany123` |

## Features

| Feature | Description |
|---------|-------------|
|  Authentication | JWT-based login with 60-minute token expiry |
|  Tool Inventory | View all samples in the central warehouse |
|  Full Inventory View | See all tools including transferred ones with location info |
|  One-Click Transfer | Move tools to any European demo account |
|  Country Isolation | Demo accounts only see tools sent to them |
|  Audit Trail | Every action is logged with timestamp and user |
|  Multilingual | Full EN/DE interface — buttons, labels, error messages |
|  Responsive | Works on desktop, tablet, and mobile |

## Project Structure

```
├── backend/
│   ├── app.py              # Flask API server (auth, tools, transfer, audit)
│   ├── data.py             # In-memory data store (tools, accounts, credentials)
│   ├── translations.py     # EN/DE backend error messages
│   ├── audit.py            # Action logging to JSON
│   ├── api_spec.yaml       # OpenAPI 3.0 specification
│   └── requirements.txt    # Python dependencies (Flask, PyJWT, Flask-CORS)
│
├── frontend/
│   ├── index.html          # Single-page application
│   ├── style.css           # Dark-themed responsive stylesheet
│   ├── app.js              # Application logic (API calls, rendering, state)
│   └── i18n.js             # UI translation strings (EN/DE)
│
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/token` | Authenticate and receive a JWT token |
| GET | `/tools` | List available tools (warehouse) or received tools (demo account) |
| GET | `/tools/all` | List ALL tools with location info (available + transferred) |
| POST | `/transfer` | Move selected tools to a demo account |
| GET | `/accounts` | List available demo country accounts |
| GET | `/audit` | View the full activity log |

All endpoints accept a `?lang=en` or `?lang=de` query parameter for localized response messages.

## Error Handling

Error messages are human-friendly and available in two languages:

| Situation | English | German |
|-----------|---------|--------|
| Wrong login | "Your login details are incorrect. Please check and try again." | "Ihre Anmeldedaten sind falsch..." |
| Expired session | "Your session has expired. Please log in again." | "Ihre Sitzung ist abgelaufen..." |
| No permission | "You do not have permission to do this." | "Sie haben keine Berechtigung..." |
| Server problem | "Something went wrong. Please try again in a moment." | "Etwas ist schiefgelaufen..." |

## What I Would Do Differently With More Time

- **Database**: Replace the in-memory store with SQLite or PostgreSQL for data persistence across restarts.
- **Return Transfers**: Add the ability to move tools back from demo accounts to the warehouse.
- **User Roles**: Implement role-based access (admin vs. viewer) so not everyone can transfer tools.
- **Real-Time Sync**: Use WebSockets to push live updates when another user moves a tool.
- **Testing**: Add automated unit tests (pytest) and end-to-end tests to catch regressions early.
- **Deployment**: Containerize with Docker and add a `docker-compose.yml` for one-command setup.
