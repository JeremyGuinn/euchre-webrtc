import { useEffect, useState } from 'react';

export const useElementHeight = (elementSelector: string) => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = document.querySelector(elementSelector);
    if (!element) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setHeight(entry.target.clientHeight);
      }
    });

    resizeObserver.observe(element);
    setHeight(element.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elementSelector]);

  return height;
};
