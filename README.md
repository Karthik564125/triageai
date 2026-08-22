# TriageAI

TriageAI is an AI-assisted support ticket management and triage system. Users can create and track support tickets, while administrators can review tickets, use Gemini-generated triage recommendations, assign tickets to support teams, manage ticket status, and add internal notes.

AI is advisory only. It can suggest a category, priority, reason, team, summary, and customer response, but an administrator has final authority. Accepting AI suggestions does not assign a team or change the ticket status; assignment and status changes are separate administrator actions.

## Features

- Client and administrator roles.
- Login using usernames and bcrypt password hashes stored in Firestore.
- React protected routes for `/user` and `/admin`.
- Ticket creation with customer details, subject, description, product/module, and optional attachment link.
- Save-only ticket creation or `Save & Analyze with AI`.
- Gemini AI recommendations for summary, category, priority, priority reason, recommended team, and suggested response.
- Admin review, editing, acceptance, or rejection of AI suggestions.
- Explicit team and optional team-member assignment.
- Ticket status management across `Open`, `Assigned`, `In Progress`, `Waiting for Customer`, `Resolved`, and `Closed`.
- Persistent activity timeline for creation, AI analysis, AI acceptance/rejection, assignment/reassignment, status changes, and internal notes.
- Persistent internal comments with author and timestamp.
- Search and filtering by ticket, customer, category, status, priority, team, and assigned user where supported by the dashboard.
- Dashboard statistics for open, assigned, in-progress, critical, and resolved tickets.
- AI failure handling: a ticket remains saved when analysis fails, and the admin can retry analysis or continue manual triage.

## Tech Stack

| Area | Technologies actually used |
| --- | --- |
| Frontend | React 19, Vite, JavaScript/JSX, TypeScript build configuration |
| Routing | React Router DOM |
| Styling | Tailwind CSS via `@tailwindcss/vite`, plus project CSS files |
| UI | Lucide React icons, React Hot Toast |
| Backend | Node.js, Express 5, CommonJS modules |
| Database | Google Firebase Cloud Firestore through `firebase-admin` |
| Authentication | Custom Express login controller, Firestore user lookup, bcryptjs password comparison, browser `localStorage` session state |
| AI | Google Gemini through `@google/generative-ai` |
| Validation and utilities | Backend input checks, AI response validation, category normalization, CORS, dotenv |
| Quality tools | Vite production build, TypeScript project build, Oxlint |

The backend package also declares `jsonwebtoken`, `mongoose`, and `zod`, but the current application flow does not use them. There is currently no active JWT middleware, MongoDB connection, or Zod-based request validation.

## System Architecture

```text
Client or Admin
	|
	v
React + Vite frontend
	|
	| HTTP requests to http://localhost:5000/api
	v
Express backend
	|
	+--> Firebase Admin SDK --> Cloud Firestore
	|
	+--> Gemini API --> AI triage suggestions
```

- **Frontend:** Renders login, client dashboard, admin dashboard, forms, tables, filters, modal workflows, and protected routes. `AuthContext` manages the browser session and `TicketContext` manages ticket/team state and applies returned ticket objects to the UI.
- **Backend:** Exposes REST endpoints, validates basic input, performs Firestore reads/writes, compares passwords, coordinates Gemini analysis, and records timeline events.
- **Firestore:** Stores users, teams, team members, tickets, comments, AI suggestions, and ticket timelines.
- **Gemini:** Receives ticket information and the available team list. It returns JSON recommendations that the backend validates before saving.

## AI Triage Workflow

1. A client or administrator creates a ticket. New tickets start with status `Open`, default priority `Medium`, category `Other`, empty assignment fields, and `aiAnalysisStatus: "pending"`.
2. The user can choose **Save Ticket**, which creates the ticket without calling Gemini.
3. The user can choose **Save & Analyze with AI**, which creates the ticket first and then calls the backend analysis endpoint. If analysis fails, the ticket remains saved.
4. The backend loads the ticket and available teams, asks Gemini for structured recommendations, validates the response, normalizes the category, and stores the result in `ai` and `aiSuggestions`.
5. The admin reviews the suggestions in the Admin Ticket Details modal and can edit them before accepting.
6. **Accept Suggestions** stores the accepted AI fields and adds an `AI Triage Accepted` timeline event. It does not assign a team and does not change the status.
7. **Assign Ticket** is a separate action. It stores the selected team/member, changes an `Open` ticket to `Assigned`, and adds a distinct `Team Assigned` or `Team Reassigned` event.
8. AI analysis and human decisions are represented in the persistent ticket timeline.

## Ticket Lifecycle

The backend accepts these status values:

```text
Open -> Assigned -> In Progress -> Waiting for Customer -> Resolved -> Closed
```

The status endpoint validates that the value is one of the six supported statuses and records a `Status Updated` timeline event when the value changes. The admin UI provides both a status selector and lifecycle actions. The assignment controller changes `Open` to `Assigned`; AI acceptance does not change status.

## Project Structure

```text
aiticketorganiser/
├── README.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── serviceAccountKey.json       # Firebase Admin credential; keep private
│   └── src/
│       ├── server.js
│       ├── seed.js
│       ├── config/
│       │   └── firebase.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── teamController.js
│       │   └── ticketController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── teamRoutes.js
│       │   └── ticketRoutes.js
│       ├── services/
│       │   └── aiService.js
│       ├── utils/
│       │   └── categoryNormalizer.js
│       └── middleware/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.jsx
│       ├── main.tsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── TicketContext.jsx
│       ├── services/
│       │   └── api.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── UserDashboard.jsx
│       │   └── AdminDashboard.jsx
│       ├── components/
│       │   ├── layout/
│       │   ├── tickets/
│       │   └── ui/
│       ├── data/
│       │   └── mockData.js
│       └── utils/
│           └── categoryNormalizer.js
```

## Installation and Setup

### Prerequisites

- Node.js and npm.
- A Firebase project with Cloud Firestore enabled.
- A Firebase service-account JSON file for the Firebase Admin SDK.
- A Google Gemini API key.

### 1. Clone the repository

```bash
git clone <repository-url>
cd aiticketorganiser
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set the values described below. Place the Firebase Admin service-account file at `backend/serviceAccountKey.json`, or update `backend/src/config/firebase.js` to use your credential location.

### 3. Seed users and teams

The seed script deletes and recreates the `users` and `teams` collections. Run it only when that reset is intended:

```bash
node src/seed.js
```

The seed data creates the application users `karthik` and `admin`, plus assignment-only team members and the supported teams. The seed script hashes the example passwords with bcryptjs before writing them.

### 4. Run the backend

From the `backend` directory:

```bash
node src/server.js
```

The API listens on `http://localhost:5000` by default.

### 5. Install and run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will print the local frontend URL, normally `http://localhost:5173`. The frontend currently calls the fixed API base URL `http://localhost:5000/api` from `frontend/src/services/api.js`.

## Environment Variables

Create `backend/.env` using this template:

```dotenv
PORT=your_port_number
GEMINI_API_KEY=your_gemini_api_key_here
```

The AI service also supports the optional variable below. If it is omitted, the code uses its configured default model name:

```dotenv
GEMINI_MODEL=your_gemini_model_name
```

Never commit the real `.env` file or API keys. Use `.env.example` as a template. The backend `.gitignore` includes `.env`; the Firebase service-account JSON is also sensitive and should be kept private and excluded from version control in a production setup.

## Firestore Data Model

The current backend uses these top-level collections:

| Collection | Purpose |
| --- | --- |
| `users` | Login users and assignment-only team members. Login users contain bcrypt `passwordHash` values; team members have `role: "team_member"`. |
| `teams` | Active support team names. |
| `tickets` | Customer details, status, priority, category, assignment, AI fields, comments, timeline, and timestamps. |
| `health` | A connectivity test document written by the health endpoint. |

Ticket documents include fields such as `ticketId`, `userId`, `customerName`, `customerEmail`, `subject`, `description`, `product`, `priority`, `category`, `status`, `assignedTeam`, `assignedMember`, `assignedUser`, `ai`, `aiSuggestions`, `aiAnalysisStatus`, `timeline`, `comments`, `createdAt`, and `updatedAt`.

## API Overview

All application routes are prefixed with `/api`.

### Authentication and teams

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Validate username/password and return a safe user object. |
| `GET` | `/api/teams` | Return team names and assignment-only team members. |
| `GET` | `/api/health` | Write a Firestore health document and report connectivity. |

### Tickets

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/tickets` | Create a ticket. |
| `GET` | `/api/tickets/my?userId=...` | Get tickets for a user ID. The endpoint can also filter by `email`. |
| `GET` | `/api/tickets` | Get all tickets for the admin dashboard. |
| `GET` | `/api/tickets/:id` | Get a ticket by Firestore document ID or readable ticket ID. |
| `PUT` | `/api/tickets/:id/assign` | Assign or reassign a team and optional team member. |
| `PUT` | `/api/tickets/:id/status` | Update status and add a timeline event. |
| `POST` | `/api/tickets/:id/comments` | Add an internal comment. |
| `POST` | `/api/tickets/:id/analyze` | Run Gemini analysis and save recommendations. |
| `POST` | `/api/tickets/:id/accept-ai` | Accept edited AI suggestions without assigning the ticket. |
| `POST` | `/api/tickets/:id/reject-ai` | Mark AI suggestions as rejected and continue manual triage. |

Successful responses generally use `{ "success": true, ... }`; failures include `{ "success": false, "message": "..." }`.

## Validation and Error Handling

- Ticket creation requires customer name, customer email, subject, and description.
- Login requires both username and password; usernames are trimmed and lowercased before lookup.
- Passwords are compared with bcryptjs, and password hashes are not returned to the frontend.
- Ticket status updates are limited to the six statuses listed above.
- Empty or whitespace-only internal comments are rejected.
- Missing tickets return a `404` response.
- Invalid login credentials return `401`.
- Backend failures return `500` with a user-safe message while logging server-side errors.
- Gemini responses must be a JSON object containing the required string fields. Priority is restricted to `Low`, `Medium`, `High`, or `Critical`; recommended teams are normalized against available Firestore teams.
- Gemini output that cannot be parsed or validated marks the ticket AI state as failed. The original ticket remains available for manual triage.
- The frontend displays toast notifications for API and workflow failures.

There is no automated backend test suite configured in the current `backend/package.json`; the backend package's test script is a placeholder that exits with an error.

## Design Decisions and Trade-offs

- **AI remains advisory:** Human approval prevents an AI recommendation from silently becoming a business decision or team assignment.
- **Assignment is explicit:** Accepting AI suggestions and assigning a ticket are separate mutations, which makes the workflow easier to audit in the timeline.
- **Firestore is the persistence layer:** Firestore provides a document-oriented model that fits tickets with nested AI data, comments, and timeline events, and it is accessed centrally through the Firebase Admin SDK.
- **Server-side AI integration:** The Gemini API key stays in the backend environment rather than being exposed in browser code.
- **Simple session model:** The frontend stores a safe user object in `localStorage`. This supports the current demo workflow but is not equivalent to a server-issued session or token.
- **Current authorization boundary:** Role-based route protection exists in the React application, but the backend routes do not currently apply an authentication middleware. Production deployment would need server-side authentication and authorization.
- **Readable ticket IDs:** IDs such as `TCK-1001` are generated from the current ticket count. This is convenient for a small application but can be vulnerable to collisions under concurrent creation or deletion.

## Limitations and Future Improvements

The following are not currently implemented but would be reasonable next steps:

- Add automated unit, integration, and end-to-end tests.
- Add server-side authentication middleware and robust role/permission checks.
- Replace browser-only session persistence with secure, expiring server sessions or tokens.
- Move Firebase credentials fully to a managed secret/configuration system.
- Add notifications for assignment, status changes, and customer responses.
- Add richer analytics, audit reporting, and pagination for larger ticket volumes.
- Add AI confidence scores, explanations, and configurable category/team taxonomies.
- Improve ticket ID generation with a transaction or another collision-resistant strategy.
- Add production deployment configuration, monitoring, rate limiting, and stricter CORS settings.

## Screenshots

Screenshots can be added here later for the login screen, client dashboard, admin dashboard, AI triage modal, ticket timeline, and internal comments workflow. No screenshot files are currently referenced by this README.

## Security Notes

- Keep `GEMINI_API_KEY` in backend environment variables and never expose it to the frontend.
- Never commit the real `.env` file or `serviceAccountKey.json`.
- The frontend uses protected routes and stores only a safe user object, not passwords or password hashes.
- Backend login returns no password hash.
- Internal comments are intended for support staff and are not customer-facing in the current UI.
- Before production use, add backend authentication/authorization, secret management, rate limiting, validation hardening, and restrictive CORS configuration.
