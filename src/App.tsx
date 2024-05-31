import "antd/dist/reset.css";
import { RouterProvider } from "react-router-dom";
import customRouter from "./modules/router/router";

const App: React.FC = () => {
  return <RouterProvider router={customRouter} />;
};

export default App;
