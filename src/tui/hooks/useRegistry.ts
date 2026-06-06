import { useState, useEffect } from 'react';
import type { PluginRegistry } from '../../core/registry.js';

export function useRegistry(registry: PluginRegistry) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, [registry]);

  return { ready };
}
