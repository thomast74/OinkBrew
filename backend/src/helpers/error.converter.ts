export const getErrorMessage = (error: any) => {
  return error.body ?? error.message ?? error.code ?? error;
};
