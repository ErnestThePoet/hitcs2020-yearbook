import { useEffect, useState } from "react";

interface WindowSize {
  w: number;
  h: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    w: 1,
    h: 1,
  });

  useEffect(() => {
    const onresize = () =>
      setWindowSize({
        w: window.innerWidth,
        h: window.innerHeight,
      });

    onresize();

    window.addEventListener("resize", onresize);

    return () => {
      window.removeEventListener("resize", onresize);
    };
  }, []);

  return windowSize;
}
