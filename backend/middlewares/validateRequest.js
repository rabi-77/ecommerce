import { ZodError } from 'zod';


export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req[source]);
      
      req[source] = result;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors
        });
      }
      
      next(error);
    }
  };
};
