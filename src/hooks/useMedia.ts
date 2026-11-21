import { useEffect, useState } from "react";

/** True while the media query matches. */
export function useMedia(query: string) {
  const get = () => !!window.matchMedia?.(query).matches;
  const [on, setOn] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setOn(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps
  return on;
}
