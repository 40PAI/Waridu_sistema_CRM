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
  Database,
  ClientsInsertSchema,
  NewClientFormSchema,
  stripUndefined,
  normalizePhone,
  formToClientsInsert,
  formToClientsUpdate,
  clientRowToForm,
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
      const validStages = ['Lead', 'MQL', 'SQL', 'Ativo', 'Perdido'];
      
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