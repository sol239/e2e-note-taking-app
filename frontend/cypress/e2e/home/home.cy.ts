describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should display the main heading', () => {
    cy.contains('Your Ideas, Encrypted').should('be.visible');
  });

  it('should display the hero description', () => {
    cy.contains('Take notes with end-to-end encryption. Create, organize, and secure your thoughts with our modern note-taking platform.').should('be.visible');
  });

  it('should display the features section', () => {
    cy.contains('Why Choose Notes?').should('be.visible');
    cy.contains('End-to-End Encryption').should('be.visible');
    cy.contains('Rich Content Blocks').should('be.visible');
    cy.contains('Organize & Collaborate').should('be.visible');
  });

  it('should display the CTA section', () => {
    cy.contains('Ready to Secure Your Thoughts?').should('be.visible');
    cy.contains('Create Your Account').should('be.visible');
  });

  it('should display the footer', () => {
    cy.contains('2025 Notes. Your notes, your privacy.').should('be.visible');
  });

  it('should display navigation', () => {
    cy.contains('Notes').should('be.visible');
  });
});