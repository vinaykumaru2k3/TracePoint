import { useEffect, useState } from "react";

const read = () => (window.location.hash || "").replace(/^#/, "");

/** Current hash route without the leading "#". */
export function useHashRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
