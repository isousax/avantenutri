import React from "react";
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
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
            {/* Lazy load devtools only in development to avoid inflating production bundle */}
            {import.meta.env.DEV && (
              <React.Suspense fallback={null}>
                {React.createElement(React.lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools }))), { initialIsOpen: false })}
              </React.Suspense>
            )}
          </BrowserRouter>
        </QuestionarioProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);