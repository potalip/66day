import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Shell } from "./Shell";
import { detectLang } from "./i18n";
import Landing from "./features/landing/Landing";

const Onboarding = lazy(() => import("./features/onboarding/Onboarding"));
const Today = lazy(() => import("./features/learn/Today"));
const PathMap = lazy(() => import("./features/learn/PathMap"));
const DayPage = lazy(() => import("./features/learn/DayPage"));
const Leaderboard = lazy(() => import("./features/game/Leaderboard"));
const Profile = lazy(() => import("./features/game/Profile"));
const Library = lazy(() => import("./features/library/Library"));
const ResourcePage = lazy(() => import("./features/library/ResourcePage"));
const Admin = lazy(() => import("./features/admin/Admin"));
const Studio = lazy(() => import("./features/studio/Studio"));
const StudioProject = lazy(() => import("./features/studio/StudioProject"));
const Portfolio = lazy(() => import("./features/learn/Portfolio"));
const Certificate = lazy(() => import("./features/game/Certificate"));
const Showcase = lazy(() => import("./ui/Showcase"));
/** Lazy page inside its own Suspense so the Shell (header/nav) never blanks while a route chunk loads. */
function page(C: React.ComponentType) {
  return <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}><C /></Suspense>;
}

// Route table. OWNER: orchestrator. Routes are pre-registered so feature agents only edit their own folders.
const router = createBrowserRouter([
  { path: "/", element: <Navigate to={`/${detectLang()}`} replace /> },
  {
    path: "/:lang",
    element: <Shell />,
    children: [
      { index: true, element: <Landing /> },
      { path: "start", element: page(Onboarding) },
      { path: "today", element: page(Today) },
      { path: "path", element: page(PathMap) },
      { path: "day/:day", element: page(DayPage) },
      { path: "leaderboard", element: page(Leaderboard) },
      { path: "me", element: page(Profile) },
      { path: "u/:userId", element: page(Profile) },
      { path: "ui", element: page(Showcase) },
      { path: "portfolio/:userId", element: page(Portfolio) },
      { path: "certificate/:userId", element: page(Certificate) },
      { path: "library", element: page(Library) },
      { path: "library/:id", element: page(ResourcePage) },
      { path: "admin/*", element: page(Admin) },
      { path: "studio", element: page(Studio) },
      { path: "studio/:id", element: page(StudioProject) },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
