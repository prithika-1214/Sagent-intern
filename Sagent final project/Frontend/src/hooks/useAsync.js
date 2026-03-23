import { useCallback, useState } from 'react';

const useAsync = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const execute = useCallback(async (action) => {
    try {
      setLoading(true);
      setError('');
      return await action();
    } catch (err) {
      const message = err?.message || 'Something went wrong';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, execute };
};

export default useAsync;
