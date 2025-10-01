describe('Gerenciamento de Projetos CRM', () => {
  before(() => {
    cy.loginAsAdmin(); // Supondo comando customizado para login
  });

  it('Deve criar projeto, mover no kanban, editar tags e ver métricas atualizadas', () => {
    // Navegar para página de projetos
    cy.visit('/crm/projects');

    // Criar novo projeto via diálogo de edição (simulação)
    cy.get('button[aria-label="Novo Projeto"]').click();

    cy.get('input#project-name').type('Projeto Teste E2E');
    cy.get('select#pipeline-status').select('1º Contato');
    cy.get('input#start-date').type('2024-07-01');
    cy.get('button').contains('Salvar').click();

    // Verificar projeto criado aparece na coluna 1º Contato
    cy.contains('Projeto Teste E2E').should('exist');

    // Arrastar projeto para coluna 'Orçamento'
    cy.get('.cursor-grab').contains('Projeto Teste E2E').trigger('mousedown', { which: 1 });
    cy.get('.min-h-[600px]').contains('Orçamento').trigger('mousemove').trigger('mouseup', { force: true });

    // Verificar projeto mudou de coluna
    cy.get('.min-h-[600px]').contains('Orçamento').parent().within(() => {
      cy.contains('Projeto Teste E2E').should('exist');
    });

    // Abrir edição do projeto
    cy.get('.cursor-grab').contains('Projeto Teste E2E').parent().find('button[aria-label^="Editar"]').click();

    // Adicionar tag
    cy.get('input[placeholder="Adicionar tag"]').type('importante{enter}');

    // Salvar alterações
    cy.get('button').contains('Salvar').click();

    // Verificar tag aparece no cartão
    cy.get('.cursor-grab').contains('Projeto Teste E2E').parent().within(() => {
      cy.contains('importante').should('exist');
    });

    // Navegar para dashboard CRM para ver métricas
    cy.visit('/crm/dashboard');

    // Verificar que o projeto aparece no total de projetos
    cy.contains('Projetos Totais').parent().within(() => {
      cy.contains('1').should('exist');
    });
  });
});