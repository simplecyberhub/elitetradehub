# Architecture Overview

## Overview

TFXC Trading Platform is a full-stack web application that provides a comprehensive trading and investment platform. It follows a client-server architecture with a React frontend and an Express.js backend, using PostgreSQL for data storage via NeonDB's serverless offering. The application supports features such as market trading, copy trading, investment plans, and user account management.

## System Architecture

The system follows a monorepo structure with clear separation between client, server, and shared code:

```
/
├── client/             # Frontend React application
├── server/             # Backend Express.js API
└── shared/             # Shared types and schemas
```

### Key Technologies

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL (via NeonDB serverless)
- **ORM**: Drizzle ORM with zod for schema validation
- **Build Tools**: Vite, esbuild
- **Styling**: TailwindCSS
- **State Management**: React Query for server state, Context API for application state
- **Routing**: Wouter (lightweight alternative to React Router)
- **Form Management**: React Hook Form with zod validation

## Key Components

### Frontend Architecture

The frontend is a React application organized as follows:

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Base UI components from shadcn/ui
│   │   ├── layout/     # Layout components (Sidebar, Header, Footer)
│   │   └── forms/      # Form components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React Context providers
│   ├── lib/            # Utility functions and API clients
│   └── main.tsx        # Application entry point
```

The frontend uses:
- **Component Library**: shadcn/ui, a collection of accessible UI components built with Radix UI primitives
- **API Communication**: React Query for data fetching, caching, and state management
- **Authentication**: Custom AuthContext using React Context API
- **Styling**: TailwindCSS with a custom theme system
- **Navigation**: Wouter for lightweight routing

### Backend Architecture

The backend is an Express.js application with the following structure:

```
server/
├── index.ts            # Server entry point
├── routes.ts           # API route definitions
├── storage.ts          # Database access layer
└── vite.ts             # Vite integration for serving the frontend
```

The backend includes:
- **API Layer**: RESTful API endpoints defined in routes.ts
- **Data Access Layer**: Abstract storage interface for database operations
- **Authentication**: Session-based authentication
- **Static Asset Serving**: Serves the built frontend application

### Database Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM. The schema includes tables for:

1. **Users**: User accounts with authentication and profile information
2. **Assets**: Market assets (stocks, crypto, forex) with pricing information
3. **Traders**: Trader profiles for copy trading
4. **Copy Relationships**: Connections between users and traders for copy trading
5. **Trades**: Trading records and positions
6. **Investment Plans**: Available investment plans 
7. **Investments**: User investments in plans
8. **Transactions**: Financial transactions (deposits, withdrawals)
9. **KYC Documents**: Know Your Customer verification documents
10. **Watchlist Items**: User's watched assets

The schema employs:
- Foreign key relationships to maintain data integrity
- Default values for standard fields
- Zod validation schemas for type safety and validation

## Data Flow

### Authentication Flow

1. User registers or logs in through the frontend forms
2. Server validates credentials and creates a session
3. Session data is stored and tracked for authenticated requests
4. Frontend stores user data in Context API and local storage for persistence
5. Protected routes check authentication state before rendering

### Trading Flow

1. User selects an asset from the Markets page
2. User creates a trade order with amount and direction (buy/sell)
3. Server validates the order and executes it if valid
4. User's balance is updated and the trade is recorded
5. Trade appears in user's active trades and transaction history

### Copy Trading Flow

1. User browses traders on the Copy Trading page
2. User selects a trader to follow and allocates funds
3. Server creates a copy relationship between user and trader
4. When the trader makes trades, they are automatically replicated for the user
5. User can monitor performance and adjust or end the copy relationship

## External Dependencies

### Frontend Dependencies

- **UI Components**: Multiple Radix UI components (@radix-ui/react-*)
- **Data Fetching**: @tanstack/react-query
- **Form Handling**: @hookform/resolvers
- **Date Handling**: date-fns
- **Styling**: TailwindCSS

### Backend Dependencies

- **Database**: @neondatabase/serverless, drizzle-orm
- **Session Management**: connect-pg-simple
- **Schema Validation**: zod, drizzle-zod

## Deployment Strategy

The application is configured for deployment on Replit with the following strategy:

1. **Development**: 
   - Uses `npm run dev` to start development server with hot-reloading
   - Vite handles frontend asset serving and HMR

2. **Production Build**:
   - Frontend: Vite builds optimized assets to dist/public
   - Backend: esbuild bundles server code to dist/index.js
   - Combined: Single build command handles both frontend and backend

3. **Production Deployment**:
   - Uses Node.js production environment
   - Server serves static frontend assets
   - Minimizes runtime dependencies
   - Configured for auto-scaling

4. **Database Management**:
   - Uses NeonDB serverless PostgreSQL
   - Database URL provided via environment variables
   - Schema changes managed via drizzle-kit

5. **Environment Configuration**:
   - Development/production modes controlled via NODE_ENV
   - Database connection via DATABASE_URL
   - Replit-specific optimizations when running in Replit environment

## Security Considerations

1. **Authentication**: Password hashing and secure session management
2. **KYC Verification**: Support for identity verification for regulatory compliance
3. **API Security**: Input validation using zod schemas
4. **Role-based Access**: User roles for permission management

## Scalability Considerations

1. **Database**: NeonDB serverless allows for auto-scaling
2. **Deployment**: Configured for auto-scaling on Replit
3. **Architecture**: Clean separation of concerns for easier scaling of individual components