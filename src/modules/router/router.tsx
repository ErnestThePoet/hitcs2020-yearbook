import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home/Home";
import Login from "@/pages/Login/Login";

const customRouter = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

export default customRouter;
