export const throwError = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

export const throw400Error = (res, message) => throwError(res, 400, message);
