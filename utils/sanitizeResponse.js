exports.sanitizeResponse = (data) => {
  return {
    ...data,
    created_at: undefined,
    deleted_at: undefined,
    updated_at: undefined,
  };
};
