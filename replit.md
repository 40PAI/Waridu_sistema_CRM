# Vite React Shadcn TypeScript Application

## Overview
This is a comprehensive React application built with Vite, TypeScript, and Shadcn UI components. It features a CRM system, project management tools, employee management, materials management, and integration with Supabase for backend services. The project aims to provide a robust, accessible, and scalable solution for managing various business operations.

## User Preferences
- None specified yet

## System Architecture

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
- **CRM System**: Client management, pipeline tracking, project management, comprehensive client management with sector, NIF (optional), and enhanced filtering.
- **Employee Management**: Role-based access control, employee profiles, task assignment, and employee filtering for project responsibilities.
- **Materials Management**: Inventory tracking, requests, transfers, specialized dashboard for Material Managers.
- **Calendar System**: Event scheduling, technician assignments.
- **Financial Management**: Cost tracking, profitability analysis.
- **Task Management**: Kanban boards, task assignment, employee assignment for events.
- **Authentication**: Supabase Auth with role-based permissions and user registration.
- **UI/UX**: Mobile-first responsive design, consistent UI.
- **Accessibility**: Comprehensive WCAG accessibility standards implemented (keyboard navigation, screen reader support, ARIA labeling, focus management, semantic HTML).

### Development and Deployment
- Development server configured for Replit (port 5000, host 0.0.0.0).
- Hot module replacement enabled.
- Deployment target: Autoscale (stateless web application).

## External Dependencies
- **Supabase**: Used for authentication, PostgreSQL database, real-time subscriptions, and file storage.
- **Lucide React**: For icons.