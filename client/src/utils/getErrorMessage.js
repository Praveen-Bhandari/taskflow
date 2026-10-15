export const getErrorMessage = (err, fallback = 'Something went wrong') => {
  const data = err.response?.data;
  if (data?.errors?.length) return data.errors.map((e) => e.message).join(', ');
  return data?.message || (err.request ? 'Server se connect nahi ho paya' : fallback);
};