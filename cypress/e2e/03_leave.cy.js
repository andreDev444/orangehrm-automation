const LEAVE_TYPE_WITH_BALANCE = 'CAN - Bereavement';
const LEAVE_TYPE_NO_BALANCE = 'CAN - FMLA';
const ENTITLEMENT_DAYS = 10;
const EMPLOYEE_FIRST_NAME = 'Qa';
const EMPLOYEE_LAST_NAME = `Auto${String(Date.now()).slice(-8)}`;
const EMPLOYEE_ID = `LV${String(Date.now()).slice(-7)}`;

describe('Módulo Leave - Asignación de licencias', () => {
    const employeeInput = 'input[placeholder="Type for hints..."]';
    const dateInput = 'input[placeholder*="yyyy"]';
    const balanceRegex = /^-?\d+(\.\d+)? Day\(s\)$/;

    const futureWorkingDay = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        while (date.getDay() === 0 || date.getDay() === 6) {
            date.setDate(date.getDate() + 1);
        }
        return date;
    };

    const addDays = (date, days) => {
        const copy = new Date(date);
        copy.setDate(copy.getDate() + days);
        return copy;
    };

    const formatDate = (date, placeholder) =>
        placeholder
            .toLowerCase()
            .replace('yyyy', String(date.getFullYear()))
            .replace('dd', String(date.getDate()).padStart(2, '0'))
            .replace('mm', String(date.getMonth() + 1).padStart(2, '0'));

    const typeDateAt = (index, date) => {
        cy.get(dateInput).eq(index).then(($input) => {
            cy.wrap($input)
                .clear()
                .type(formatDate(date, $input.attr('placeholder')))
                .blur();
        });
    };

    const enterDates = (fromDate, toDate) => {
        typeDateAt(0, fromDate);
        typeDateAt(1, toDate);
    };

    const selectEmployee = () => {
        cy.get(employeeInput).clear().type(EMPLOYEE_LAST_NAME);
        cy.get('.oxd-autocomplete-option', { timeout: 10000 })
            .should('not.contain', 'Searching...')
            .should('not.contain', 'No Records Found')
            .first()
            .click();
    };

    const selectLeaveType = (leaveType) => {
        cy.get('.oxd-select-text').first().click();
        cy.contains('.oxd-select-option', leaveType).click();
    };

    const selectScheduledStatus = () => {
        cy.contains('label', 'Show Leave with Status')
            .parents('.oxd-input-group')
            .first()
            .then(($group) => {
                if (!$group.text().includes('Scheduled')) {
                    cy.wrap($group).find('.oxd-select-text').click();
                    cy.contains('.oxd-select-option', 'Scheduled').click();
                }
            });
    };

    const expectPositiveBalance = () => {
        cy.contains('p', balanceRegex, { timeout: 10000 }).should(($balance) => {
            const value = Number.parseFloat($balance.text());
            expect(value, 'saldo disponible').to.be.greaterThan(0);
            expect(value, 'saldo disponible').to.be.at.most(ENTITLEMENT_DAYS);
        });
    };

    const clickAssign = () => cy.contains('button[type="submit"]', 'Assign').click();

    const login = () => {
        cy.visit('/');
        cy.location('pathname').then((pathname) => {
            if (pathname.includes('/auth/login')) {
                cy.get('input[name="username"]').type('Admin');
                cy.get('input[name="password"]').type('admin123');
                cy.get('button[type="submit"]').click();
            }
        });
        cy.url().should('include', '/dashboard');
    };

    const createEmployee = () => {
        cy.visit('/web/index.php/pim/addEmployee');
        cy.contains('h6', 'Add Employee', { timeout: 15000 }).should('be.visible');
        cy.get('input[name="firstName"]').clear().type(EMPLOYEE_FIRST_NAME);
        cy.get('input[name="lastName"]').clear().type(EMPLOYEE_LAST_NAME);
        cy.contains('label', 'Employee Id')
            .parent()
            .siblings('div')
            .find('input')
            .clear()
            .type(EMPLOYEE_ID);
        cy.intercept('POST', '**/api/v2/pim/employees').as('saveEmployee');
        cy.get('button[type="submit"]').click();
        cy.wait('@saveEmployee').its('response.statusCode').should('eq', 200);
        cy.contains('.oxd-toast', 'Successfully Saved').should('be.visible');
    };

    const createEntitlement = () => {
        cy.visit('/web/index.php/leave/addLeaveEntitlement');
        cy.contains('label', 'Employee Name', { timeout: 15000 }).should('be.visible');
        selectEmployee();
        selectLeaveType(LEAVE_TYPE_WITH_BALANCE);
        cy.contains('label', 'Entitlement')
            .parent()
            .siblings('div')
            .find('input')
            .clear()
            .type(String(ENTITLEMENT_DAYS));
        cy.contains('button[type="submit"]', 'Save').click();
        cy.get('.oxd-toast, .oxd-dialog-sheet', { timeout: 10000 })
            .should('exist')
            .then(($el) => {
                if ($el.text().includes('Confirm')) {
                    cy.contains('button', 'Confirm').click();
                }
            });
        cy.contains('.oxd-toast', 'Successfully Saved').should('be.visible');
    };

    before(() => {
        login();
        createEmployee();
        createEntitlement();
    });

    beforeEach(() => {
        login();
        cy.visit('/web/index.php/leave/assignLeave');
        cy.contains('label', 'Employee Name', { timeout: 15000 }).should('be.visible');
    });

    it('TC-LEAVE-01: Asignar una licencia con saldo y verificarla en la lista', () => {
        const assignmentDate = futureWorkingDay();

        selectEmployee();
        selectLeaveType(LEAVE_TYPE_WITH_BALANCE);
        expectPositiveBalance();

        enterDates(assignmentDate, assignmentDate);
        clickAssign();
        cy.contains('.oxd-toast', 'Successfully Saved').should('be.visible');

        cy.visit('/web/index.php/leave/viewLeaveList');
        cy.contains('label', 'Show Leave with Status', { timeout: 15000 }).should('be.visible');
        typeDateAt(0, assignmentDate);
        typeDateAt(1, assignmentDate);
        selectScheduledStatus();
        selectEmployee();
        cy.contains('button[type="submit"]', 'Search').click();

        cy.get('.oxd-table-card', { timeout: 15000 })
            .should('have.length.at.least', 1)
            .and('contain', LEAVE_TYPE_WITH_BALANCE);
    });

    it('TC-LEAVE-02: Consultar el saldo disponible para el empleado y tipo de licencia', () => {
        selectEmployee();
        selectLeaveType(LEAVE_TYPE_WITH_BALANCE);

        expectPositiveBalance();
    });

    it('TC-LEAVE-03: Rechazar una solicitud cuya fecha final es anterior a la inicial', () => {
        const fromDate = futureWorkingDay();

        selectEmployee();
        selectLeaveType(LEAVE_TYPE_WITH_BALANCE);
        enterDates(fromDate, addDays(fromDate, -1));
        clickAssign();

        cy.contains('.oxd-input-field-error-message', 'To date should be after from date')
            .should('be.visible');
        cy.contains('.oxd-toast', 'Successfully').should('not.exist');
    });

    it('TC-LEAVE-04: Mostrar aviso al asignar un tipo de licencia sin saldo', () => {
        const fromDate = futureWorkingDay();

        selectEmployee();
        selectLeaveType(LEAVE_TYPE_NO_BALANCE);
        cy.contains('p', '0.00 Day(s)').should('be.visible');

        enterDates(fromDate, fromDate);
        clickAssign();

        cy.contains('Employee does not have sufficient leave balance').should('be.visible');
        cy.contains('button', 'Cancel').click();
        cy.contains('Confirm Leave Assignment').should('not.exist');
    });
});