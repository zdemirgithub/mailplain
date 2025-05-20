describe('Mail features', () => {
  beforeEach(() => {
    cy.login(); // custom command to login test user
    cy.visit('/mail');
  });

  it('displays list of mail threads', () => {
    cy.get('[data-testid="mail-thread"]').should('have.length.greaterThan', 0);
  });

  it('opens a mail thread and displays content', () => {
    cy.get('[data-testid="mail-thread"]').first().click();
    cy.get('[data-testid="mail-content"]').should('be.visible');
  });

  it('sends a new mail', () => {
    cy.get('button[data-testid="compose-mail"]').click();
    cy.get('input[name="to"]').type('recipient@example.com');
    cy.get('input[name="subject"]').type('Test mail');
    cy.get('textarea[name="body"]').type('This is a test email.');
    cy.get('button[data-testid="send-mail"]').click();

    cy.contains('Mail sent successfully').should('be.visible');
  });
});
