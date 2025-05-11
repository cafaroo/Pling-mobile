// Mock för react-hook-form
// Löser problemen med useProfileForm och useSettingsForm testerna

/**
 * Mockad version av useForm hook som returnerar en förenklad version
 * med alla viktiga metoder och funktioner som används i formulären
 */
const useForm = (options = {}) => {
  // Standardvärden som kommer att användas om inga ges
  const defaultValues = options.defaultValues || {};
  
  // State som håller nuvarande värden
  let values = { ...defaultValues };
  
  // Skapa registerfunktionen som används för att koppla fält
  const register = (name) => ({
    name,
    onChange: (event) => {
      if (event && event.target) {
        values[name] = event.target.value;
      } else {
        values[name] = event;
      }
    },
    onBlur: () => {},
    ref: () => {},
  });
  
  // Funktion för att sätta ett specifikt fältvärde
  const setValue = (name, value, options = {}) => {
    values[name] = value;
  };
  
  // Reset-funktion för att återställa formuläret
  const reset = (newValues = defaultValues, options = {}) => {
    values = { ...newValues };
  };
  
  // Returnerar felmeddelanden (mockad version)
  const formState = {
    errors: {},
    isDirty: false,
    isSubmitting: false,
    isSubmitted: false,
    isValid: true,
    isValidating: false,
    dirtyFields: {},
    touchedFields: {},
    submitCount: 0,
  };
  
  // Submit-funktion
  const handleSubmit = (onValid, onInvalid) => (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    return onValid(values);
  };
  
  // Vanliga getter-funktioner
  const getValues = (fieldNames) => {
    if (fieldNames === undefined) {
      return values;
    }
    
    if (Array.isArray(fieldNames)) {
      return fieldNames.reduce((obj, name) => {
        obj[name] = values[name];
        return obj;
      }, {});
    }
    
    return values[fieldNames];
  };
  
  const watch = (fieldNames) => getValues(fieldNames);
  
  // Felhantering
  const setError = (name, error) => {
    formState.errors[name] = error;
  };
  
  const clearErrors = (name) => {
    if (name === undefined) {
      formState.errors = {};
    } else if (Array.isArray(name)) {
      name.forEach(fieldName => {
        delete formState.errors[fieldName];
      });
    } else {
      delete formState.errors[name];
    }
  };
  
  // Validering
  const trigger = async (name) => {
    return true;
  };
  
  return {
    register,
    handleSubmit,
    formState,
    setValue,
    getValues,
    watch,
    reset,
    trigger,
    setError,
    clearErrors,
    control: { 
      register, 
      fieldArrays: {}, 
      getFieldState: () => ({}),
      _formValues: values,
      _options: options,
      _fields: {},
    },
  };
};

// Mock för Controller-komponenten som används i många formulär
const Controller = ({ name, control, render, defaultValue, rules }) => {
  const fieldState = { invalid: false, error: undefined };
  const field = {
    name,
    value: defaultValue,
    onChange: jest.fn(),
    onBlur: jest.fn(),
    ref: jest.fn(),
  };
  
  // Anropa render-funktionen med field och fieldState
  return render({ field, fieldState });
};

// Hjälpare för formulärvalidering
const zodResolver = (schema) => async (data) => {
  try {
    const validData = schema ? schema.parse(data) : data;
    return {
      values: validData,
      errors: {},
    };
  } catch (error) {
    return {
      values: {},
      errors: {
        ...error.errors?.reduce((acc, err) => {
          acc[err.path.join('.')] = { 
            type: 'validation', 
            message: err.message 
          };
          return acc;
        }, {})
      }
    };
  }
};

// FormProvider för kontext-baserade formulär
const FormProvider = ({ children, ...props }) => {
  return children;
};

// useFieldArray för hantering av fältarrayer
const useFieldArray = ({ control, name }) => {
  const fields = [];
  
  return {
    fields,
    append: jest.fn(),
    prepend: jest.fn(),
    insert: jest.fn(),
    swap: jest.fn(),
    move: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    replace: jest.fn(),
  };
};

// useWatch för att observera fältvärden
const useWatch = ({ control, name, defaultValue }) => {
  return defaultValue;
};

// useFormContext för att få åtkomst till formulärmetoder i djupt nästlade komponenter
const useFormContext = () => {
  return useForm();
};

// useController som är en hook-version av Controller
const useController = ({ name, control, defaultValue, rules }) => {
  return {
    field: {
      name,
      value: defaultValue,
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    },
    fieldState: { 
      invalid: false, 
      isTouched: false, 
      isDirty: false, 
      error: undefined 
    },
    formState: {
      errors: {},
      isDirty: false,
      isSubmitting: false,
      isSubmitted: false,
      isValid: true,
      isValidating: false,
      dirtyFields: {},
      touchedFields: {},
      submitCount: 0,
    },
  };
};

// Exportera alla komponenter och hooks
module.exports = {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
  useFieldArray,
  useWatch,
  useController,
  
  // Validering
  zodResolver,
}; 