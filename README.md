# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

## Fluxo de Assinatura e Agendamento (Produto)

Fluxo simplificado (sem downgrade):

1. Usuário cria conta.
2. Acessa área de consultas (lista vazia se nenhuma marcada).
3. Ao tentar agendar sem capability CONSULTA_AGENDAR é redirecionado para `/planos?intent=consultation`.
4. Página de planos mostra banner contextual explicando o motivo.
5. Usuário seleciona plano e conclui pagamento (TransparentCheckoutForm).
6. Após status approved disparamos `entitlements:refresh` e o usuário pode voltar para agendar.

Detalhes técnicos:
- Hook `usePlanIntent` centraliza parsing/limpeza de `?intent`.
- Banner é persistido (sessionStorage) quando dispensado para não reaparecer.
- Conceito de downgrade e código legado removidos.
- Entitlements cacheados com TTL 10min + ETag evitando loops de fetch.

Próximos incrementos sugeridos:
- Outros intents (ex: `diet`, `reports`).
- Métricas de conversão por origem do redirecionamento.
- Testes de integração para fluxo de upgrade + refresh de entitlements.
```
