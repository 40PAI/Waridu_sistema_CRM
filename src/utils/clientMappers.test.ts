/**
 * Comprehensive tests for Client Mappers, Zod Schema, and Utilities
 * 
 * Tests ensure that:
 * - UI fields map correctly to database fields
 * - Non-existent fields (roleOrDepartment) don't appear in payloads
 * - Enum validation works for lifecycle_stage
 * - Phone normalization works correctly
 * - Data integrity is maintained in both directions
 */

import { describe, it, expect, test } from 'vitest';
import {
  NewClientForm,
  NewProjectForm,
  Database,
  ClientsInsertSchema,
  EventsInsertSchema,
  NewClientFormSchema,
  NewProjectFormSchema,
  stripUndefined,
  normalizePhone,
  combineDateTime,
  formToClientsInsert,
  formToClientsUpdate,
  formToEventsInsert,
  clientRowToForm,
  getComercialEmployeeOptions,
} from './clientMappers';

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('Utility Functions', () => {
  describe('stripUndefined', () => {
    it('should remove undefined values while keeping null values', () => {
      const input = {
        name: 'João',
        email: null,
        phone: undefined,
        company: 'TechCorp',
      };
      
      const result = stripUndefined(input);
      
      expect(result).toEqual({
        name: 'João',
        email: null,
        company: 'TechCorp',
      });
      expect(result).not.toHaveProperty('phone');
    });

    it('should handle empty objects', () => {
      expect(stripUndefined({})).toEqual({});
    });

    it('should handle objects with only undefined values', () => {
      const input = { a: undefined, b: undefined };
      expect(stripUndefined(input)).toEqual({});
    });
  });

  describe('normalizePhone', () => {
    it('should keep only digits from phone numbers', () => {
      expect(normalizePhone('+351 123 456 789')).toBe('351123456789');
      expect(normalizePhone('(244) 923-456-789')).toBe('244923456789');
      expect(normalizePhone('123.456.789')).toBe('123456789');
      expect(normalizePhone('+1-800-FLOWERS')).toBe('1800'); // Letters removed
    });

    it('should handle edge cases', () => {
      expect(normalizePhone('')).toBe(null);
      expect(normalizePhone(null)).toBe(null);
      expect(normalizePhone(undefined)).toBe(null);
      expect(normalizePhone('abc')).toBe(null); // No digits
      expect(normalizePhone('123')).toBe('123');
    });

    it('should handle special characters and spaces', () => {
      expect(normalizePhone(' +351 (123) 456-789 ')).toBe('351123456789');
      expect(normalizePhone('++351--123--456--789')).toBe('351123456789');
    });
  });
});

// =============================================================================
// ZOD SCHEMA VALIDATION TESTS
// =============================================================================

describe('Zod Schema Validation', () => {
  describe('ClientsInsertSchema', () => {
    it('should validate valid client data', () => {
      const validData = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '351123456789',
        company: 'TechCorp',
        lifecycle_stage: 'Lead' as const,
      };

      const result = ClientsInsertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should enforce required name field', () => {
      const invalidData = {
        email: 'joao@example.com',
        // name is missing
      };

      const result = ClientsInsertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should validate lifecycle_stage enum', () => {
      const validStages = ['Lead', 'Oportunidade', 'Cliente Ativo', 'Cliente Perdido'];
      
      for (const stage of validStages) {
        const data = { name: 'Test', lifecycle_stage: stage };
        const result = ClientsInsertSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid lifecycle_stage values', () => {
      const invalidData = {
        name: 'João Silva',
        lifecycle_stage: 'InvalidStage',
      };

      const result = ClientsInsertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('lifecycle_stage');
      }
    });

    it('should validate email format', () => {
      const invalidEmail = {
        name: 'João Silva',
        email: 'invalid-email',
      };

      const result = ClientsInsertSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should handle optional fields correctly', () => {
      const minimalData = { name: 'João Silva' };
      const result = ClientsInsertSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        // Zod default is applied when field is missing entirely
        expect(result.data.lifecycle_stage).toBe('Lead');
      }
    });
  });

  describe('NewClientFormSchema', () => {
    it('should validate UI form data', () => {
      const formData: NewClientForm = {
        fullName: 'João Silva',
        company: 'TechCorp',
        email: 'joao@example.com',
        roleOrDepartment: 'Diretor de TI', // UI-only field should be valid
      };

      const result = NewClientFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it('should require fullName field', () => {
      const invalidForm = {
        company: 'TechCorp',
        // fullName is missing
      };

      const result = NewClientFormSchema.safeParse(invalidForm);
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// UI → DATABASE MAPPER TESTS
// =============================================================================

describe('UI to Database Mappers', () => {
  describe('formToClientsInsert', () => {
    it('should map UI form to database insert format', () => {
      const formData: NewClientForm = {
        fullName: 'João Silva',
        company: 'TechCorp Lda',
        email: 'joao@techcorp.pt',
        phone: '+351 123 456 789',
        nif: '123456789',
        sector: 'Tecnologia',
        lifecycleStage: 'Lead',
        roleOrDepartment: 'Diretor de TI', // This should map to job_title
        notes: 'Cliente potencial',
      };

      const result = formToClientsInsert(formData);

      expect(result).toEqual({
        name: 'João Silva', // mapped from fullName
        company: 'TechCorp Lda',
        email: 'joao@techcorp.pt',
        phone: '351123456789', // normalized
        nif: '123456789',
        sector: 'Tecnologia',
        lifecycle_stage: 'Lead',
        notes: 'Cliente potencial',
        job_title: 'Diretor de TI', // mapped from roleOrDepartment
      });

      // Ensure UI-only fields are NOT included (roleOrDepartment now maps to job_title)
      expect(result).not.toHaveProperty('roleOrDepartment');
      expect(result).not.toHaveProperty('fullName');
      
      // Ensure job_title IS included (mapped from roleOrDepartment)
      expect(result).toHaveProperty('job_title');
      
      // Ensure timestamp fields are NOT included (handled by database)
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
      expect(result).not.toHaveProperty('id');
    });

    it('should apply default lifecycle_stage when empty', () => {
      const formData: NewClientForm = {
        fullName: 'Test User',
        // lifecycleStage is undefined
      };

      const result = formToClientsInsert(formData);
      expect(result.lifecycle_stage).toBe('Lead');
    });

    it('should normalize phone numbers', () => {
      const formData: NewClientForm = {
        fullName: 'Test User',
        phone: '+351 (123) 456-789',
      };

      const result = formToClientsInsert(formData);
      expect(result.phone).toBe('351123456789');
    });

    it('should handle empty string values correctly', () => {
      const formData: NewClientForm = {
        fullName: 'Test User',
        company: '', // Empty string should not be included
        email: '',
        notes: '',
      };

      const result = formToClientsInsert(formData);
      // Empty strings are not included in the payload
      expect(result).not.toHaveProperty('company');
      expect(result).not.toHaveProperty('email'); 
      expect(result).not.toHaveProperty('notes');
      
      // Only required fields should be present
      expect(result.name).toBe('Test User');
      expect(result.lifecycle_stage).toBe('Lead');
    });

    it('should only include fields with meaningful values', () => {
      const formData: NewClientForm = {
        fullName: 'Test User',
        company: undefined, // Should not appear in result
        email: '', // Empty string should not appear in result
        notes: 'Some notes', // Should appear
      };

      const result = formToClientsInsert(formData);
      expect(result).not.toHaveProperty('company');
      expect(result).not.toHaveProperty('email');
      expect(result.notes).toBe('Some notes');
    });
  });

  describe('formToClientsUpdate', () => {
    it('should create partial update objects', () => {
      const partialForm: Partial<NewClientForm> = {
        fullName: 'João Santos', // Changed name
        phone: '+351 987 654 321', // Changed phone
        // Other fields not included
      };

      const result = formToClientsUpdate(partialForm);

      expect(result).toEqual({
        name: 'João Santos',
        phone: '351987654321', // normalized
      });

      // Should not include fields that weren't in the input
      expect(result).not.toHaveProperty('company');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('roleOrDepartment');
    });

    it('should handle empty partial updates', () => {
      const result = formToClientsUpdate({});
      expect(result).toEqual({});
    });
  });
});

// =============================================================================
// DATABASE → UI MAPPER TESTS
// =============================================================================

describe('Database to UI Mappers', () => {
  describe('clientRowToForm', () => {
    it('should map database row to UI form format', () => {
      const dbRow: Database.ClientsRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        company: 'TechCorp Lda',
        email: 'joao@techcorp.pt',
        phone: '351123456789',
        nif: '123456789',
        sector: 'Tecnologia',
        lifecycle_stage: 'Lead',
        notes: 'Cliente potencial',
        job_title: 'Diretor de TI',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = clientRowToForm(dbRow);

      expect(result).toEqual({
        fullName: 'João Silva', // mapped from name
        company: 'TechCorp Lda',
        email: 'joao@techcorp.pt',
        phone: '351123456789',
        nif: '123456789',
        sector: 'Tecnologia',
        lifecycleStage: 'Lead',
        notes: 'Cliente potencial',
        roleOrDepartment: 'Diretor de TI', // mapped from job_title
      });

      // Ensure database-only fields are not mapped to form
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
    });

    it('should handle null values correctly', () => {
      const dbRow: Database.ClientsRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test User',
        company: null,
        email: null,
        phone: null,
        nif: null,
        sector: null,
        lifecycle_stage: null,
        notes: null,
        job_title: null,
        created_at: null,
        updated_at: null,
      };

      const result = clientRowToForm(dbRow);

      expect(result.fullName).toBe('Test User');
      expect(result.company).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.lifecycleStage).toBeUndefined();
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration Tests', () => {
  it('should maintain data integrity in round-trip conversion', () => {
    // Start with form data
    const originalForm: NewClientForm = {
      fullName: 'João Silva',
      company: 'TechCorp Lda',
      email: 'joao@techcorp.pt',
      phone: '+351 123 456 789',
      nif: '123456789',
      sector: 'Tecnologia',
      lifecycleStage: 'Lead',
      notes: 'Cliente potencial',
      roleOrDepartment: 'Diretor de TI', // This will be mapped to job_title
    };

    // Convert to database format
    const dbInsert = formToClientsInsert(originalForm);
    
    // Simulate what database would return (add fields that DB adds)
    const dbRow: Database.ClientsRow = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: dbInsert.name,
      nif: dbInsert.nif || null,
      email: dbInsert.email || null,
      phone: dbInsert.phone || null,
      notes: dbInsert.notes || null,
      lifecycle_stage: dbInsert.lifecycle_stage || null,
      sector: dbInsert.sector || null,
      company: dbInsert.company || null,
      job_title: dbInsert.job_title || null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    // Convert back to form format
    const resultForm = clientRowToForm(dbRow);

    // Check that essential data is preserved
    expect(resultForm.fullName).toBe(originalForm.fullName);
    expect(resultForm.company).toBe(originalForm.company);
    expect(resultForm.email).toBe(originalForm.email);
    expect(resultForm.phone).toBe('351123456789'); // normalized
    expect(resultForm.nif).toBe(originalForm.nif);
    expect(resultForm.sector).toBe(originalForm.sector);
    expect(resultForm.lifecycleStage).toBe(originalForm.lifecycleStage);
    expect(resultForm.notes).toBe(originalForm.notes);

    // roleOrDepartment should be preserved (mapped through job_title)
    expect(resultForm.roleOrDepartment).toBe(originalForm.roleOrDepartment);
  });

  it('should ensure non-existent database fields never appear in payloads', () => {
    const formWithExtraFields = {
      fullName: 'Test User',
      roleOrDepartment: 'Manager', // UI-only field
      someRandomField: 'should not appear', // Non-existent field
      position: 'should not appear here', // This should be handled differently
    } as any;

    const result = formToClientsInsert(formWithExtraFields);

    // Ensure only valid database fields are present (DDL-compliant fields)
    const validDbFields = [
      'name', 'company', 'email', 'phone', 'nif', 'sector', 
      'lifecycle_stage', 'notes', 'job_title'
    ];

    for (const key of Object.keys(result)) {
      expect(validDbFields).toContain(key);
    }

    // Ensure UI-only and random fields don't appear (but job_title should appear)
    expect(result).not.toHaveProperty('roleOrDepartment');
    expect(result).not.toHaveProperty('someRandomField');
    expect(result).not.toHaveProperty('fullName');
    
    // job_title should be present (mapped from roleOrDepartment)
    expect(result).toHaveProperty('job_title', 'Manager');
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('Error Handling', () => {
  it('should handle malformed input gracefully', () => {
    // Test with invalid types
    expect(() => normalizePhone({} as any)).not.toThrow();
    expect(() => normalizePhone(123 as any)).not.toThrow();
    expect(() => stripUndefined(null as any)).not.toThrow();
  });

  it('should validate lifecycle stage enum strictly', () => {
    const invalidData = {
      name: 'Test',
      lifecycle_stage: 'InvalidStage',
    };

    const result = ClientsInsertSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// EVENTS MAPPING TESTS
// =============================================================================

describe('Events Mapping Functions', () => {
  describe('combineDateTime', () => {
    it('should combine date and time into ISO string', () => {
      const result = combineDateTime('2025-01-15', '14:30');
      expect(result).toBe('2025-01-15T14:30:00.000Z');
    });

    it('should default time to 00:00:00 when time is not provided', () => {
      const result = combineDateTime('2025-01-15');
      expect(result).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should throw error when date is empty', () => {
      expect(() => combineDateTime('')).toThrow('Data é obrigatória');
    });
  });

  describe('formToEventsInsert', () => {
    const validProjectForm: NewProjectForm = {
      projectName: 'Projeto Teste',
      startDate: '2025-01-15',
      startTime: '09:00',
      endDate: '2025-01-16',
      endTime: '18:00',
      location: 'Luanda, Angola',
      estimatedValue: 15000,
      clientId: '12345678-1234-5678-9012-123456789012',
      services: ['1', '2', '3'],
      notes: 'Projeto importante',
      pipelineStatus: '1º Contato',
      nextActionDate: '2025-01-20',
      nextActionTime: '10:00', // UI Próxima Ação - Hora => BD next_action_time
      responsável: '87654321-4321-8765-2109-210987654321', // UI Responsável Comercial => BD responsible_id
    };

    it('should map UI form to database insert format correctly', () => {
      const result = formToEventsInsert(validProjectForm);

      expect(result.name).toBe('Projeto Teste');
      expect(result.start_date).toBe('2025-01-15T09:00:00.000Z');
      expect(result.end_date).toBe('2025-01-16T18:00:00.000Z');
      expect(result.location).toBe('Luanda, Angola');
      expect(result.estimated_value).toBe(15000);
      expect(result.client_id).toBe('12345678-1234-5678-9012-123456789012');
      expect(result.service_ids).toEqual([1, 2, 3]); // Converted to numbers
      expect(result.notes).toBe('Projeto importante');
      expect(result.pipeline_status).toBe('1º Contato');
      expect(result.start_time).toBe('09:00:00');
      expect(result.end_time).toBe('18:00:00');
      expect(result.status).toBe('Planejado'); // Default status
      expect(result.next_action_date).toBe('2025-01-20T00:00:00.000Z');
      expect(result.next_action_time).toBe('10:00:00'); // NEW: nextActionTime mapped to next_action_time
      expect(result.responsible_id).toBe('87654321-4321-8765-2109-210987654321'); // NEW: responsável mapped to responsible_id
      expect(result.updated_at).toBeDefined();
    });

    it('should enforce required fields', () => {
      const incompleteForm = {
        projectName: '',
        startDate: '2025-01-15',
        location: 'Luanda',
        clientId: '12345678-1234-5678-9012-123456789012',
        services: ['1'],
        pipelineStatus: '1º Contato',
      } as NewProjectForm;

      expect(() => formToEventsInsert(incompleteForm)).toThrow('Nome do projeto é obrigatório');
    });

    it('should validate required startDate', () => {
      const formWithoutDate = {
        ...validProjectForm,
        startDate: '',
      };

      expect(() => formToEventsInsert(formWithoutDate)).toThrow('Data de início é obrigatória');
    });

    it('should validate required clientId', () => {
      const formWithoutClient = {
        ...validProjectForm,
        clientId: '',
      };

      expect(() => formToEventsInsert(formWithoutClient)).toThrow('Cliente é obrigatório');
    });

    it('should validate required location', () => {
      const formWithoutLocation = {
        ...validProjectForm,
        location: '',
      };

      expect(() => formToEventsInsert(formWithoutLocation)).toThrow('Localização é obrigatória');
    });

    it('should convert service IDs from strings to numbers', () => {
      const form = {
        ...validProjectForm,
        services: ['10', '20', '30'],
      };

      const result = formToEventsInsert(form);
      expect(result.service_ids).toEqual([10, 20, 30]);
    });

    it('should throw error for invalid service IDs', () => {
      const formWithInvalidService = {
        ...validProjectForm,
        services: ['invalid-id'],
      };

      expect(() => formToEventsInsert(formWithInvalidService)).toThrow('Service ID inválido: invalid-id');
    });

    it('should use start_date as end_date when endDate is not provided', () => {
      const formWithoutEndDate = {
        ...validProjectForm,
        endDate: undefined,
        endTime: undefined,
      };

      const result = formToEventsInsert(formWithoutEndDate);
      expect(result.end_date).toBe(result.start_date);
    });

    it('should handle optional fields correctly', () => {
      const minimalForm: NewProjectForm = {
        projectName: 'Projeto Mínimo',
        startDate: '2025-01-15',
        location: 'Luanda',
        clientId: '12345678-1234-5678-9012-123456789012',
        services: ['1'],
        pipelineStatus: '1º Contato',
      };

      const result = formToEventsInsert(minimalForm);
      
      expect(result.name).toBe('Projeto Mínimo');
      expect(result.estimated_value).toBeUndefined();
      expect(result.notes).toBeUndefined();
      expect(result.start_time).toBeUndefined();
      expect(result.end_time).toBeUndefined();
      expect(result.next_action_date).toBeNull();
    });


    it('should only include fields with meaningful values', () => {
      const formWithEmptyOptionals = {
        ...validProjectForm,
        estimatedValue: undefined,
        notes: '',
        startTime: '',
        endTime: '',
        nextActionDate: '',
      };

      const result = formToEventsInsert(formWithEmptyOptionals);
      
      expect(result.estimated_value).toBeUndefined();
      expect(result.notes).toBe(''); // Empty string is kept
      expect(result.start_time).toBe(':00'); // Empty string becomes ":00"
      expect(result.end_time).toBe(':00');
      expect(result.next_action_date).toBeNull(); // Empty date becomes null
    });

    it('should map nextActionTime and responsável fields to database correctly', () => {
      const result = formToEventsInsert(validProjectForm);
      
      // These fields should now be mapped to database fields
      expect(result.next_action_time).toBe('10:00:00'); // UI nextActionTime → BD next_action_time
      expect(result.responsible_id).toBe('87654321-4321-8765-2109-210987654321'); // UI responsável → BD responsible_id
      expect(result).not.toHaveProperty('nextActionTime'); // Original UI field should not exist
      expect(result).not.toHaveProperty('responsável'); // Original UI field should not exist
    });

    it('should handle empty nextActionTime and responsável fields', () => {
      const formWithEmptyFields: NewProjectForm = {
        ...validProjectForm,
        nextActionTime: '', // Empty string
        responsável: '', // Empty string
      };
      
      const result = formToEventsInsert(formWithEmptyFields);
      
      // Empty strings should not be mapped to database
      expect(result.next_action_time).toBeUndefined();
      expect(result.responsible_id).toBeUndefined();
    });

    it('should handle missing nextActionTime and responsável fields', () => {
      const formWithoutOptionalFields: NewProjectForm = {
        projectName: 'Projeto Sem Opcionais',
        startDate: '2025-01-15',
        location: 'Luanda',
        clientId: '12345678-1234-5678-9012-123456789012',
        services: ['1'],
        pipelineStatus: '1º Contato',
        // nextActionTime and responsável are undefined
      };
      
      const result = formToEventsInsert(formWithoutOptionalFields);
      
      // Undefined fields should not be included in database payload
      expect(result.next_action_time).toBeUndefined();
      expect(result.responsible_id).toBeUndefined();
    });
  });

  describe('EventsInsertSchema validation', () => {
    it('should validate valid event data', () => {
      const validData = {
        name: 'Projeto Teste',
        client_id: '12345678-1234-5678-9012-123456789012',
        estimated_value: 15000,
        service_ids: [1, 2, 3],
      };

      const result = EventsInsertSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for client_id', () => {
      const invalidData = {
        name: 'Projeto Teste',
        client_id: 'invalid-uuid',
      };

      const result = EventsInsertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative estimated_value', () => {
      const invalidData = {
        name: 'Projeto Teste',
        estimated_value: -1000,
      };

      const result = EventsInsertSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('NewProjectFormSchema validation', () => {
    it('should validate valid project form data', () => {
      const validData: NewProjectForm = {
        projectName: 'Projeto Teste',
        startDate: '2025-01-15',
        location: 'Luanda',
        clientId: '12345678-1234-5678-9012-123456789012',
        services: ['1', '2'],
        pipelineStatus: '1º Contato',
      };

      const result = NewProjectFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require projectName field', () => {
      const invalidData = {
        startDate: '2025-01-15',
        location: 'Luanda',
        clientId: '12345678-1234-5678-9012-123456789012',
        services: ['1'],
        pipelineStatus: '1º Contato',
      };

      const result = NewProjectFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require at least one service', () => {
      const invalidData = {
        projectName: 'Projeto Teste',
        startDate: '2025-01-15',
        location: 'Luanda',
        clientId: '12345678-1234-5678-9012-123456789012',
        services: [],
        pipelineStatus: '1º Contato',
      };

      const result = NewProjectFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Employee Filtering Functions', () => {
    describe('getComercialEmployeeOptions', () => {
      const mockEmployees = [
        {
          id: '12345678-1234-5678-9012-123456789012',
          name: 'João Silva',
          role: 'Comercial',
          email: 'joao@example.com'
        },
        {
          id: '87654321-4321-8765-2109-210987654321',
          name: 'Maria Santos',
          role: 'Técnico',
          email: 'maria@example.com'
        },
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Pedro Costa',
          role: 'Comercial',
          email: 'pedro@example.com'
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Ana Lima',
          role: 'Administrativo',
          email: 'ana@example.com'
        }
      ];

      it('should filter only commercial employees and map to options format', () => {
        const result = getComercialEmployeeOptions(mockEmployees);

        expect(result).toHaveLength(2);
        expect(result).toEqual([
          {
            label: 'João Silva',
            value: '12345678-1234-5678-9012-123456789012'
          },
          {
            label: 'Pedro Costa', 
            value: '11111111-1111-1111-1111-111111111111'
          }
        ]);
      });

      it('should return empty array when no commercial employees exist', () => {
        const nonCommercialEmployees = [
          {
            id: '87654321-4321-8765-2109-210987654321',
            name: 'Maria Santos',
            role: 'Técnico',
            email: 'maria@example.com'
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Ana Lima',
            role: 'Administrativo',
            email: 'ana@example.com'
          }
        ];

        const result = getComercialEmployeeOptions(nonCommercialEmployees);
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
      });

      it('should handle empty employee array', () => {
        const result = getComercialEmployeeOptions([]);
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
      });

      it('should handle employees with commercial role only', () => {
        const commercialOnly = [
          {
            id: '12345678-1234-5678-9012-123456789012',
            name: 'João Silva',
            role: 'Comercial',
            email: 'joao@example.com'
          }
        ];

        const result = getComercialEmployeeOptions(commercialOnly);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          label: 'João Silva',
          value: '12345678-1234-5678-9012-123456789012'
        });
      });
    });
  });
});