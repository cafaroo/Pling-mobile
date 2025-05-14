// Mock för Zod-biblioteket
// Används för schemavalidering med react-hook-form

// Skapar en grundläggande schemastruktur som kan hantera kedjning
function createSchemaType(type) {
  // Skapa bas-metoder som alla scheman har
  const schema = {
    _type: type,
    _isOptional: false,
    
    // Schema-transformation
    optional: function() {
      return {
        ...schema,
        _type: `${type}.optional`,
        _isOptional: true
      };
    },
    
    // Validering
    min: function(min, message) {
      return this;
    },
    max: function(max, message) {
      return this;
    },
    email: function(message) {
      return this;
    },
    minLength: function(min, message) {
      return this;
    },
    maxLength: function(max, message) {
      return this;
    },
    
    // Schema operation
    transform: function(fn) {
      return this;
    },
    default: function(defaultValue) {
      return this;
    },
    
    // Validering
    parse: function(data) {
      return data;
    },
    safeParse: function(data) {
      return { success: true, data };
    }
  };
  
  return schema;
}

// Skapa Zod-objektet
const z = {
  string: function() {
    return createSchemaType('string');
  },
  number: function() {
    return createSchemaType('number');
  },
  boolean: function() {
    return createSchemaType('boolean');
  },
  date: function() {
    return createSchemaType('date');
  },
  object: function(shape) {
    const schema = createSchemaType('object');
    schema.shape = shape || {};
    return schema;
  },
  array: function(schema) {
    return createSchemaType('array');
  },
  enum: function(values) {
    const schema = createSchemaType('enum');
    schema._values = values;
    return schema;
  }
};

// ZodError och resolver
class ZodError extends Error {
  constructor(issues = []) {
    super('Validation failed');
    this.issues = issues;
  }
}

// Mock för @hookform/resolvers/zod
const zodResolver = (schema) => {
  return (values) => {
    return {
      values,
      errors: {}
    };
  };
};

// Skapa ett mock-form-objekt för useForm
const mockForm = {
  register: () => ({}),
  handleSubmit: (fn) => (data) => fn(data),
  formState: {
    errors: {},
    isValid: true,
    isDirty: false,
    isSubmitting: false
  },
  reset: () => {},
  setValue: jest.fn(),
  getValues: jest.fn().mockImplementation(() => ({})),
  trigger: jest.fn().mockResolvedValue(true),
  watch: jest.fn().mockImplementation(() => ({}))
};

// Mock för react-hook-form
const useForm = (options = {}) => {
  const formInstance = { 
    ...mockForm,
    setValue: jest.fn(),
    getValues: jest.fn().mockImplementation(() => options.defaultValues || {}),
    trigger: jest.fn().mockResolvedValue(true),
    watch: jest.fn().mockImplementation(() => options.defaultValues || {})
  };
  
  return formInstance;
};

// Export
module.exports = {
  // Zod-objektet
  string: z.string,
  number: z.number,
  boolean: z.boolean,
  date: z.date,
  object: z.object,
  array: z.array,
  enum: z.enum,
  
  // Error-hantering
  ZodError,
  
  // Hook-form integration
  zodResolver,
  useForm,
  
  // Z-objektet för import { z } from 'zod'
  z,
  default: z
}; 