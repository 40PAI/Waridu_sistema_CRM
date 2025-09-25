# Vite React Shadcn TypeScript Application

## Overview
This is a comprehensive React application built with Vite, TypeScript, and Shadcn UI components. It features a CRM system, project management tools, employee management, materials management, and integration with Supabase for backend services.

## Recent Changes (September 25, 2025)
- ✅ Configured Vite for Replit environment (port 5000, host 0.0.0.0)
- ✅ Set up frontend development workflow
- ✅ Installed all project dependencies
- ✅ Configured deployment settings for production (autoscale)
- ✅ Fixed all LSP diagnostics and compilation issues
- ✅ **Comprehensive Client Management Implementation**:
  - Updated client fields: "Setor" as free text, "Persona" renamed to "Função na Empresa"
  - Implemented all 10 required fields (Nome, Empresa, Email, Telefone, NIF, Setor, Função na Empresa, Ciclo de Vida, Serviços de Interesse, Observações)
  - Enhanced filtering system with advanced filters for sector, position, lifecycle, services
  - Improved search functionality for name and company
  - Full CRUD operations with validation and error handling
  - Seamless project integration from client pages and detail modal
  - Fixed schema alignment between frontend and database

## Project Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling
- **Shadcn UI** component library
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **TanStack Query** for state management
- **Lucide React** for icons

### Backend Integration
- **Supabase** for authentication, database, and backend services
- PostgreSQL database with Row Level Security (RLS)
- Real-time subscriptions
- File storage for avatars and documents

### Key Features
- **CRM System**: Client management, pipeline tracking, project management
- **Employee Management**: Role-based access control, employee profiles
- **Materials Management**: Inventory tracking, requests, transfers
- **Calendar System**: Event scheduling, technician assignments
- **Financial Management**: Cost tracking, profitability analysis
- **Task Management**: Kanban boards, task assignment
- **Authentication**: Supabase Auth with role-based permissions

### Development Configuration
- Development server runs on port 5000
- Hot module replacement enabled
- LSP diagnostics resolved
- All dependencies properly installed

### Deployment Configuration
- Target: Autoscale (stateless web application)
- Build command: `npm run build`
- Run command: `npm run preview`
- Production server configured on port 5000

## User Preferences
- None specified yet

## Next Steps
The application is now ready for development and deployment in the Replit environment.