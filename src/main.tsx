import React from "react";
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts";
import { QuestionarioProvider } from "./contexts/QuestionarioProvider";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <QuestionarioProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QuestionarioProvider>
    </AuthProvider>
  </React.StrictMode>
);