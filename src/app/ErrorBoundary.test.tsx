import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ErrorBoundary, { PageError, SceneError } from "./ErrorBoundary";

/* Server rendering never runs error boundaries, so the state rules are tested directly. */
describe("ErrorBoundary", () => {
  const boom = new Error("boom");

  it("stores a render error", () => {
    expect(ErrorBoundary.getDerivedStateFromError(boom)).toEqual({ error: boom });
  });

  it("clears the error when the reset key changes, and keeps it otherwise", () => {
    const props = { resetKey: "/stack/2", fallback: () => null, children: null };
    expect(ErrorBoundary.getDerivedStateFromProps(props, { error: boom, key: "/stack/1" })).toEqual({ error: null, key: "/stack/2" });
    expect(ErrorBoundary.getDerivedStateFromProps(props, { error: boom, key: "/stack/2" })).toBeNull();
  });

  it("renders its children when nothing failed", () => {
    const html = renderToStaticMarkup(<ErrorBoundary resetKey="a" fallback={() => <p>bad</p>}><p>good</p></ErrorBoundary>);
    expect(html).toBe("<p>good</p>");
  });

  it("offers a way out of a broken page, and labels a broken diagram", () => {
    const page = renderToStaticMarkup(<PageError />);
    expect(page).toContain("Reload the page");
    expect(page).toContain('href="#/"');
    expect(renderToStaticMarkup(<SceneError />)).toContain('aria-label="The diagram for this step could not be drawn"');
  });
});
