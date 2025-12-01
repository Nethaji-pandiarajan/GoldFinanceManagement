import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import 'react-datepicker/dist/react-datepicker.css';
import 'datatables.net-dt/css/dataTables.dataTables.css';
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
