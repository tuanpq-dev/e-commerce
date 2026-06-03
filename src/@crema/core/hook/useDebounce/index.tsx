import { useEffect, useState } from "react";

const useDebounce = (value: string | number, delay = 800) => {
  const [debounce, setDebounce] = useState(value);

  useEffect(() => {
    const search = setTimeout(() => {
      setDebounce(value);
    }, delay);

    return (): void => {
      clearTimeout(search);
    };
  }, [value, delay]);

  return debounce;
};

export default useDebounce;
