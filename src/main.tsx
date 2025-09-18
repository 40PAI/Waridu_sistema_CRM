import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";

// Registrar service worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
</dyad-file>

<dyad-write path="cypress/e2e/crm.cy.ts" description="Testes E2E com Cypress para kanban, filtros e auth.">
describe('CRM Waridu - Testes E2E', () => {
  beforeEach(() => {
    cy.loginAsAdmin(); // Comando customizado para login
  });

  it('Deve criar projeto, mover no kanban e ver em dashboard', () => {
    cy.visit('/crm/pipeline');

    // Criar projeto
    cy.get('button[aria-label="Novo Projeto"]').click();
    cy.get('input#project-name').type('Projeto E2E');
    cy.get('select#pipeline-status').select('1º Contato');
    cy.get('input#start-date').type('2024-07-01');
    cy.get('button').contains('Salvar').click();

    // Verificar criação
    cy.contains('Projeto E2E').should('exist');

    // Mover para Orçamento
    cy.get('.cursor-grab').contains('Projeto E2E').trigger('mousedown', { which: 1 });
    cy.get('.min-h-[600px]').contains('Orçamento').trigger('mousemove').trigger('mouseup', { force: true });

    // Verificar movimento
    cy.get('.min-h-[600px]').contains('Orçamento').within(() => {
      cy.contains('Projeto E2E').should('exist');
    });

    // Verificar no dashboard
    cy.visit('/crm/dashboard');
    cy.contains('Projetos no Pipeline').parent().within(() => {
      cy.contains('1').should('exist');
    });
  });

  it('Deve filtrar clientes por tags e setor', () => {
    cy.visit('/crm/clients');

    // Adicionar tag
    cy.get('button').contains('+ Tag').first().click();
    cy.get('input[placeholder="Nova tag"]').type('urgente{enter}');

    // Filtrar por tag
    cy.get('.cursor-pointer').contains('urgente').click();
    cy.get('tbody tr').should('have.length.greaterThan', 0);

    // Filtrar por setor
    cy.get('select').contains('Setor').parent().find('select').select('Tecnologia');
    cy.get('tbody tr').should('have.length.greaterThan', 0);
  });

  it('Deve sincronizar emails via Gmail', () => {
    cy.visit('/crm/clients');

    // Assumir login com Google
    cy.get('button').contains('Sincronizar Emails').click();
    cy.contains('Emails sincronizados com sucesso!').should('exist');
  });
});