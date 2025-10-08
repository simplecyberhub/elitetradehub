# Overview

TFXC Trading Platform is a full-stack web application that provides a comprehensive trading and investment platform. It features real-time market data, copy trading functionality, investment plans, KYC verification, and portfolio management. The application follows a modern client-server architecture with a React frontend and Express.js backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter (lightweight alternative to React Router)
- **Styling**: TailwindCSS with shadcn/ui component library for consistent design
- **State Management**: 
  - React Query for server state management and caching
  - React Context API for authentication state
- **Form Handling**: React Hook Form with Zod validation schemas
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database Layer**: Drizzle ORM with PostgreSQL (NeonDB serverless)
- **Authentication**: Header-based authentication system with role-based access control
- **Data Validation**: Zod schemas shared between frontend and backend

## Database Design
- **Primary Database**: PostgreSQL via NeonDB serverless connection
- **ORM**: Drizzle ORM with type-safe queries and migrations
- **Schema Structure**:
  - Users table with role-based permissions (user/admin)
  - Assets table for stocks, crypto, and forex instruments
  - Traders table for copy trading functionality
  - Trades, investments, and transaction tracking
  - KYC documents and verification workflow
  - Watchlist and copy trading relationships

## Key Features Architecture
- **Copy Trading System**: Follower-trader relationship model with allocation percentages
- **Investment Plans**: Tiered investment products with ROI tracking
- **KYC Verification**: Document upload and admin approval workflow
- **Multi-Asset Trading**: Support for stocks, cryptocurrency, and forex markets
- **Real-time Updates**: Live market data integration with caching

## Deployment Structure
- **Monorepo**: Single repository with client, server, and shared code
- **Build Process**: Separate builds for frontend (Vite) and backend (esbuild)
- **Static Assets**: Frontend builds to dist/public directory
- **Development**: Hot reloading with Vite dev server integration

# External Dependencies

## Database Services
- **NeonDB**: Serverless PostgreSQL database hosting
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI/UX Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: Pre-built component library following Radix patterns
- **React Helmet**: Document head management for SEO
- **Recharts**: Charts and data visualization library

## Development Tools
- **Replit Integration**: Development environment with runtime error overlay
- **TypeScript**: Static type checking across frontend and backend
- **Zod**: Runtime type validation and schema definition
- **React Query**: Server state management with caching and background updates

## Build and Dev Dependencies
- **Vite**: Frontend build tool with HMR support
- **esbuild**: Backend bundling for production deployment
- **PostCSS**: CSS processing with Autoprefixer
- **tsx**: TypeScript execution for development server