import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts";
import { QuestionarioProvider } from "./contexts/QuestionarioProvider";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
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
