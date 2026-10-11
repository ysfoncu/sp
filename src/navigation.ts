import { useSyncExternalStore } from "react";
import { requestLeave, isDirty } from "./navGuard";
import { PlacesRoute, formatPlacesHash, parsePlacesHash, PLACES_ROOT } from "./types/placesRoute";

// There is no router: the app keeps its view in state. This adds just enough history for the Praksis places page:
// the place, tab and entity live in the URL hash, every entry carries the app view in `history.state`, and
// Back/Forward are applied (or held back by the unsaved-edit guard).
export type HistoryState = { view?: string } | null;
const EVENT = "app:navigate";

export const getHash = () => window.location.hash;
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener("popstate", cb);
    window.removeEventListener(EVENT, cb);
  };
};
export const useHash = () => useSyncExternalStore(subscribe, getHash, () => "");

// What the page last showed; a refused Back puts this back
let committed = { url: "", state: null as HistoryState };
const remember = () => (committed = { url: window.location.pathname + window.location.search + window.location.hash, state: window.history.state });

const write = (url: string, state: HistoryState, replace: boolean) => {
  if (replace) window.history.replaceState(state, "", url);
  else window.history.pushState(state, "", url);
  remember();
  window.dispatchEvent(new Event(EVENT));
};

// Moves within the Praksis places page. Normalising a route passes `replace` so it adds no history entry.
// `focusEntity` asks the entity page to take focus when it opens (a user action, not a restored URL).
let focusRequested = false;
export const consumeFocusRequest = () => {
  const was = focusRequested;
  focusRequested = false;
  return was;
};

export const goPlaces = (route: PlacesRoute, opts: { replace?: boolean; focusEntity?: boolean } = {}) => {
  const url = formatPlacesHash(route);
  if (url === getHash()) return;
  const run = () => {
    focusRequested = !!opts.focusEntity && !!route.entityId;
    write(url, { view: "praksisplaces" }, !!opts.replace);
  };
  if (opts.replace) run();
  else requestLeave(run);
};

// Switches the app view from the sidebar. Places keeps its own hash; other views have none.
export const goView = (view: string, current: string, setView: (v: any) => void) => {
  if (view === current) return;
  requestLeave(() => {
    if (view === "praksisplaces") write(parsePlacesHash(getHash()) ? getHash() : PLACES_ROOT, { view }, false);
    else write(window.location.pathname + window.location.search, { view }, false);
    setView(view);
  });
};

const viewOf = (): string | null => (window.history.state as HistoryState)?.view ?? (parsePlacesHash(getHash()) ? "praksisplaces" : null);

// Applies Back/Forward. With unsaved changes the move is undone at once and the user is asked.
export const installHistory = (initialView: string, setView: (v: any) => void) => {
  window.history.replaceState({ ...(window.history.state ?? {}), view: initialView }, "");
  remember();

  const onPop = () => {
    const target = { url: window.location.pathname + window.location.search + window.location.hash, state: window.history.state as HistoryState, view: viewOf() };
    if (isDirty()) {
      window.history.pushState(committed.state, "", committed.url); // stay where we were
      window.dispatchEvent(new Event(EVENT));
      requestLeave(() => {
        write(target.url, target.state, false);
        if (target.view) setView(target.view);
      });
      return;
    }
    remember();
    if (target.view) setView(target.view);
  };
  const onHash = () => {
    // Someone typed a places URL while another view showed
    if (parsePlacesHash(getHash()) && !(window.history.state as HistoryState)?.view) setView("praksisplaces");
  };
  const onUnload = (e: BeforeUnloadEvent) => {
    if (isDirty()) {
      e.preventDefault();
      e.returnValue = "";
    }
  };
  window.addEventListener("popstate", onPop);
  window.addEventListener("hashchange", onHash);
  window.addEventListener("beforeunload", onUnload);
  return () => {
    window.removeEventListener("popstate", onPop);
    window.removeEventListener("hashchange", onHash);
    window.removeEventListener("beforeunload", onUnload);
  };
};
