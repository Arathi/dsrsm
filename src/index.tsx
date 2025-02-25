import ReactDOM from "react-dom/client";
import { ConfigProvider, App as AntApp } from "antd";

import App from "./App";

const root = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(root).render(
  <>
    <ConfigProvider>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </>
);
