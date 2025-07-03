import { useState, useEffect } from 'react';

/**
 * Hook to ensure content is only rendered on the client side.
 * This prevents hydration mismatches when content differs between server and client.
 */
export function useIsClient(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
