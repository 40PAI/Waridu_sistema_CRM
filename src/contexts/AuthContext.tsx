import * as React from "react";
import { createContext, useState, useContext, ReactNode } from "react";

type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico';

interface User {
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, pass: string) => void;
  logout: () => void;
  // Esta função será nossa ferramenta de desenvolvimento
  switchRole: (role: Role) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Simula o login
  const login = (email: string, pass: string) => {
    console.log(`Tentativa de login com ${email} e ${pass}`);
    // Lógica de simulação: qualquer login funciona e define o usuário como Admin
    setUser({ name: "Admin User", email: email, role: "Admin" });
    setIsAuthenticated(true);
  };

  // Simula o logout
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Ferramenta para trocar de papel durante o desenvolvimento
  const switchRole = (role: Role) => {
    if (user) {
      setUser({ ...user, role });
    } else {
      // Se não houver usuário, cria um mock para o papel selecionado
      setUser({ name: `${role} User`, email: "test@example.com", role });
      setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};