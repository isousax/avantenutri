import React from "react";
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from "./contexts";
import { QuestionarioProvider } from "./contexts/QuestionarioProvider";
import { queryClient } from './lib/queryClient';
import "./index.css";
import App from "./App";
import DevQueryPanel from './panels/DevQueryPanel';
import { API } from './config/api';

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('[BOOT] API base:', API.API_AUTH_BASE);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QuestionarioProvider>
          <BrowserRouter>
            <App />
            {import.meta.env.DEV && <DevQueryPanel />}
            <ReactQueryDevtools initialIsOpen={false} />
          </BrowserRouter>
        </QuestionarioProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);