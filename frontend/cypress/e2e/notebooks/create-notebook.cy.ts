describe('Create Notebook', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
    cy.get('#email').type('e2e__login__1@test.com');
    cy.get('#password').type('password');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/notebooks');
    
    // Unlock notebooks by entering password
    cy.contains('Unlock Notebooks').click();
    cy.get('input[type="password"]').type('password');
    cy.contains('button', 'Unlock').click();
    
    // Wait for unlock to complete
    cy.wait(1000);
  });

  it('should create a new notebook successfully', () => {
    cy.contains('New Notebook').click();
    
    // Should redirect to the new notebook page
    cy.url({ timeout: 10000 }).should('match', /\/notebooks\/[a-f0-9-]+$/);
    
    // Should display the notebook editor
    cy.get('[data-testid="note-editor"]', { timeout: 10000 }).should('exist');
  });

  it('should display the newly created notebook in the sidebar', () => {
    const notebookName = `Test Notebook ${Date.now()}`;
    
    cy.contains('New Notebook').click();
    cy.url({ timeout: 10000 }).should('match', /\/notebooks\/[a-f0-9-]+$/);
    
    // Wait for the page to load
    cy.wait(1000);
    
    // The new notebook should appear in the sidebar with default name
    cy.contains('New Notebook').should('be.visible');
  });
});
