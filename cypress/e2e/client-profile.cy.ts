describe('Ficha do Cliente - Testes E2E', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('Deve exibir ficha completa do cliente com métricas e projetos', () => {
    cy.visit('/crm/clients');
    cy.get('tbody tr').first().find('button').contains('Ver').click();

    // Verificar informações principais
    cy.contains('Informações Principais').should('exist');
    cy.contains('Métricas rápidas').should('exist');

    // Verificar métricas
    cy.contains('Projetos').should('exist');
    cy.contains('Receita Estimada').should('exist');

    // Verificar projetos associados
    cy.contains('Projetos Associados').should('exist');
  });

  it('Deve filtrar comunicações por tipo e buscar', () => {
    cy.visit('/crm/clients');
    cy.get('tbody tr').first().find('button').contains('Ver').click();

    // Filtrar por emails
    cy.get('select').contains('Todos').parent().find('select').select('email');
    cy.get('.vertical-timeline-element').should('have.length.greaterThan', 0);

    // Buscar por termo
    cy.get('input[placeholder*="Buscar"]').type('teste');
    cy.get('.vertical-timeline-element').should('have.length.lessThan', 10);
  });

  it('Deve sincronizar emails via Gmail', () => {
    cy.visit('/crm/clients');
    cy.get('button').contains('Sincronizar Emails').click();
    cy.contains('Emails sincronizados com sucesso!').should('exist');
  });
});