// Error handling middleware
const notFound = (req, res, next) => {
    console.log('so im here');
    
  const error = new Error(`Not Found -jujujuju ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
    console.log('hehe');
    
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.log('so finally im here right',err.message,'yy');
  
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
