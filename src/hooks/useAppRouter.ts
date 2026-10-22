import { useState, useEffect, useCallback } from "react";

export type AppRoute =
  | "login"
  | "pending-approval"
  | "rejected"
  | "home"
  | "members"
  | "admin";

export function useAppRouter() {
  const parseRoute = (): { route: AppRoute; anchor: string | null } => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, "");

    // Check pathname or hash
    if (path === "/login" || hash === "login") {
      return { route: "login", anchor: null };
    }
    if (path === "/pending-approval" || hash === "pending-approval") {
      return { route: "pending-approval", anchor: null };
    }
    if (path === "/rejected" || hash === "rejected") {
      return { route: "rejected", anchor: null };
    }
    if (
      path === "/members" ||
      path === "/members-portal" ||
      hash === "members" ||
      hash === "members-portal"
    ) {
      return { route: "members", anchor: null };
    }
    if (
      path === "/admin" ||
      path === "/admin-portal" ||
      hash === "admin" ||
      hash === "admin-portal"
    ) {
      return { route: "admin", anchor: null };
    }

    // Default to home with optional anchor (e.g. about, events, committee)
    const anchor = hash && !["home", ""].includes(hash) ? hash : null;
    return { route: "home", anchor };
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => parseRoute().route);
  const [targetAnchor, setTargetAnchor] = useState<string | null>(() => parseRoute().anchor);

  const handleLocationChange = useCallback(() => {
    const parsed = parseRoute();
    setCurrentRoute(parsed.route);
    setTargetAnchor(parsed.anchor);

    if (parsed.route === "home" && parsed.anchor) {
      setTimeout(() => {
        const el = document.getElementById(parsed.anchor!);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [handleLocationChange]);

  const navigateTo = useCallback(
    (route: AppRoute, anchor?: string) => {
      let targetPath = "/";
      let targetHash = "";

      switch (route) {
        case "login":
          targetPath = "/login";
          targetHash = "#/login";
          break;
        case "pending-approval":
          targetPath = "/pending-approval";
          targetHash = "#/pending-approval";
          break;
        case "rejected":
          targetPath = "/rejected";
          targetHash = "#/rejected";
          break;
        case "members":
          targetPath = "/members";
          targetHash = "#/members";
          break;
        case "admin":
          targetPath = "/admin";
          targetHash = "#/admin";
          break;
        case "home":
        default:
          targetPath = "/";
          targetHash = anchor ? `#${anchor}` : "#/";
          break;
      }

      // Update browser history and hash for universal compatibility
      try {
        window.history.pushState({}, "", targetHash ? targetHash : targetPath);
      } catch {
        window.location.hash = targetHash;
      }

      handleLocationChange();
    },
    [handleLocationChange]
  );

  return {
    currentRoute,
    targetAnchor,
    navigateTo,
  };
}
