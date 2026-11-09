describe('Módulo 1: Autenticación (Login) - OrangeHRM', () => {

  beforeEach(() => {
    cy.visit('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  });

  it('TC01 - Login Exitoso con credenciales válidas', () => {
    cy.get('input[name="username"]').type('Admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('.oxd-topbar-header-title').should('contain', 'Dashboard');
  });

  it('TC02 - Intento de Login con contraseña incorrecta', () => {
    cy.get('input[name="username"]').type('Admin');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('.oxd-alert-content-text')
      .should('be.visible')
      .and('contain', 'Invalid credentials');
  });

  it('TC03 - Intento de Login con campo de usuario vacío', () => {
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.get('.oxd-input-group__message')
      .should('be.visible')
      .and('contain', 'Required');
  });

  it('TC04 - Intento de Login con campos vacíos', () => {
    cy.get('button[type="submit"]').click();

    cy.get('.oxd-input-group__message').should('have.length', 2);
  });

  it('TC05 - Verificación del enlace "Forgot your password?"', () => {
    cy.get('.orangehrm-login-forgot-header').click();

    cy.url().should('include', '/requestPasswordResetCode');
    cy.get('.orangehrm-forgot-password-title').should('contain', 'Reset Password');
  });
});