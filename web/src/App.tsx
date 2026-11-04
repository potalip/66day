import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Shell } from "./Shell";
import { detectLang } from "./i18n";
import Landing from "./features/landing/Landing";
import Onboarding from "./features/onboarding/Onboarding";
import Today from "./features/learn/Today";
import PathMap from "./features/learn/PathMap";
import DayPage from "./features/learn/DayPage";
import Leaderboard from "./features/game/Leaderboard";
import Profile from "./features/game/Profile";
import Library from "./features/library/Library";
import ResourcePage from "./features/library/ResourcePage";
import Admin from "./features/admin/Admin";
import Studio from "./features/studio/Studio";
import StudioProject from "./features/studio/StudioProject";

// Route table. OWNER: orchestrator. Routes are pre-registered so feature agents only edit their own folders.
const router = createBrowserRouter([
  { path: "/", element: <Navigate to={`/${detectLang()}`} replace /> },
  {
    path: "/:lang",
    element: <Shell />,
    children: [
      { index: true, element: <Landing /> },
      { path: "start", element: <Onboarding /> },
      { path: "today", element: <Today /> },
      { path: "path", element: <PathMap /> },
      { path: "day/:day", element: <DayPage /> },
      { path: "leaderboard", element: <Leaderboard /> },
      { path: "me", element: <Profile /> },
      { path: "library", element: <Library /> },
      { path: "library/:id", element: <ResourcePage /> },
      { path: "admin/*", element: <Admin /> },
      { path: "studio", element: <Studio /> },
      { path: "studio/:id", element: <StudioProject /> },
    ],
  },
]);

export function App() { return <RouterProvider router={router} />; }
