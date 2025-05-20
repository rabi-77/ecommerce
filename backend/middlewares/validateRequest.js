import { ZodError } from 'zod';

/**
 * Middleware to validate request data against a Zod schema
 * @param {Object} schema - Zod schema to validate against
 * @param {String} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // Validate the request data against the schema
      const result = schema.parse(req[source]);
      
      // Replace the request data with the validated data
      req[source] = result;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format the validation errors
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors
        });
      }
      
      // If it's not a validation error, pass it to the next error handler
      next(error);
    }
  };
};
