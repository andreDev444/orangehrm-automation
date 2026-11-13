describe('Módulo PIM - Gestión de Empleados', () => {
    const uniqueId = Date.now().toString().slice(-4);
    const firstName = `Miller_${uniqueId}`;
    const middleName = 'S.'
    const lastName = 'QA_Test';
    const empId = `ID-${uniqueId}`;
    const username = `miller.auto.${uniqueId}`;

    beforeEach(() => {

        // Visitar la demo y hacer el login 
        cy.visit('/');
        cy.get('input[name="username"]').type('Admin');
        cy.get('input[name="password"]').type('admin123');
        cy.get('button[type="submit"]').click();

        // navegar al módulo PIM 
        cy.contains('span', 'PIM').click();
        cy.contains('a', 'Add Employee').click();

        cy.get('h6').contains('Add Employee').should('be.visible');
    });

    it('TC-PIM-01: Crear empleado exitosamente con datos mínimos obligatorios', () => {
        // Interceptamos la petición POST para no usar tiempos fijos de espera (mala práctica)
        cy.intercept('POST', '**/api/v2/pim/employees').as('saveEmployee');

        // Campos del nombre 
        cy.get('input[name="firstName"]').type(firstName);
        cy.get('input[name="lastName"]').type(lastName);

        // boton guardar 
        cy.get('button[type="submit"]').click()

        // validar intercepción 
        cy.wait('@saveEmployee').its('response.statusCode').should('eq', 200)

        // mensaje de exito
        cy.contains('.oxd-toast', 'Successfully Saved').should('be.visible')

        cy.url().should('include', 'viewPersonalDetails');
    });

    it('TC-PIM-02: Crear empleado con todos los campos y credenciales de acceso', () => {
        cy.intercept('POST', '**/api/v2/pim/employees').as('saveEmployee');

        cy.get('input[name="firstName"]').type(firstName);
        cy.get('input[name="middleName"]').type(middleName);
        cy.get('input[name="lastName"]').type(lastName);

        cy.contains('label', 'Employee Id').parent().siblings('div').find('input').clear().type(empId);

        cy.get('.oxd-switch-input').click();
        // campos ocultos de credenciales 

        cy.contains('label', 'Username').parent().siblings('div').find('input').type(username); // username 
        cy.contains('label', 'Password').parent().siblings('div').find('input[type="password"]').type('Admin123*'); // password
        cy.contains('label', 'Confirm Password').parent().siblings('div').find('input[type="password"]').type('Admin123*'); // confirm password 


        cy.get('button[type="submit"]').click()

        cy.wait('@saveEmployee').its('response.statusCode').should('eq', 200);
        cy.contains('.oxd-toast', 'Successfully Saved').should('be.visible');
        cy.url().should('include', 'viewPersonalDetails');
    });

    it('TC-PIM-03: Validar error al intentar guardar con campos obligatorios vacíos', () => {
    // click en guardar sin llenar ningun dato 
    cy.get('button[type="submit"]').click();

    // validamos que los mensajes de error aparezcan en el DOM
    // buscamos la clase del error, verificamos que haya exactamente 2, y que contengan la palabra "Required"
    cy.get('.oxd-input-field-error-message')
        .should('have.length', 2)
        .and('contain', 'Required');
    });

    it('TC-PIM-04: Validar error al ingresar un Employee ID duplicado', () => {
    const duplicatedId = `DUP-${Date.now().toString().slice(-4)}`;

    // crear el primer empleado 
    cy.get('input[name="firstName"]').type('Original');
    cy.get('input[name="lastName"]').type('User');
    cy.contains('label', 'Employee Id').parent().siblings('div').find('input').clear().type(duplicatedId);
    cy.get('button[type="submit"]').click();
    
    // esperamos la confirmación visual de que el ID ya existe en la base de datos
    cy.contains('.oxd-toast', 'Successfully Saved').should('be.visible');
    cy.url().should('include', 'viewPersonalDetails');

    // volver a la pantalla "Add Employee" sin reiniciar el login
    cy.contains('a', 'Add Employee').click();
    cy.get('h6').contains('Add Employee').should('be.visible');

    // intentar crear un SEGUNDO empleado inyectando el mismo id
    cy.get('input[name="firstName"]').type('Clon');
    cy.get('input[name="lastName"]').type('User');
    cy.contains('label', 'Employee Id').parent().siblings('div').find('input').clear().type(duplicatedId);
    
    cy.get('button[type="submit"]').click();

    // 4. Validar que el sistema despliega el mensaje de error exacto
    cy.contains('.oxd-input-field-error-message', 'Employee Id already exists').should('be.visible');
    });

    it('TC-PIM-05: Buscar y verificar la persistencia del empleado en la lista general', () => {
    const uniqueSearchId = `SRC-${Date.now().toString().slice(-4)}`;
    const searchName = `MillerBusqueda`;

    // Interceptamos el guardado para estabilizar la prueba
    cy.intercept('POST', '**/api/v2/pim/employees').as('saveForSearch');

    // crear un empleado específico para esta prueba de búsqueda
    cy.get('input[name="firstName"]').type(searchName);
    cy.get('input[name="lastName"]').type('QA_Test');
    cy.contains('label', 'Employee Id').parent().siblings('div').find('input').clear().type(uniqueSearchId);
    cy.get('button[type="submit"]').click();
    
    
    cy.wait('@saveForSearch').its('response.statusCode').should('eq', 200);
    cy.contains('.oxd-toast', 'Successfully Saved').should('be.visible');
    cy.url().should('include', 'viewPersonalDetails');

    // navegar a la pestaña "Employee List" en el menú superior
    cy.contains('a', 'Employee List').click();
    
    cy.url().should('include', 'viewEmployeeList');
    cy.get('.oxd-table-filter').should('be.visible');
    
    // Interceptamos la petición GET que se dispara al buscar
    cy.intercept('GET', '**/api/v2/pim/employees?*').as('searchEmployee');

    // ingresar el ID único en el filtro de búsqueda
    cy.contains('label', 'Employee Id').parent().siblings('div').find('input').type(uniqueSearchId);
    cy.get('button[type="submit"]').click();

    // esperar que el servidor devuelva los resultados filtrados
    cy.wait('@searchEmployee').its('response.statusCode').should('eq', 200);

    // validar que la tabla muestra exactamente 1 fila y contiene los datos correctos
    cy.get('.oxd-table-card')
        .should('have.length', 1)
        .and('contain', uniqueSearchId)
        .and('contain', searchName);
    });
});

