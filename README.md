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

## Modelo de Créditos de Consulta (Atual)

O antigo sistema de planos foi descontinuado. Agora o usuário compra créditos de tipos específicos de consulta:

1. Cria conta e preenche o questionário.
2. Vai em "Agendar Consulta".
3. Caso não tenha crédito para o tipo selecionado (ex: `avaliacao_completa`), usa os botões de compra que iniciam o pagamento (Mercado Pago).
4. Webhook aprova o pagamento e gera um registro em `consultation_credits` (status `available`).
5. Ao agendar, o backend consome (`used`) um crédito correspondente ao tipo.

Características:
- Endpoint público `/consultations/pricing` expõe preços dinâmicos administrados em painel.
- Fallback de preços no backend garante continuidade caso não haja registro ativo.
- Frontend usa React Query para cache leve (2 min) dos preços.
- Gating simples: sem crédito disponível → CTA de compra.

Próximos incrementos sugeridos:
- Auditoria de consumo de créditos (log detalhado).
- Expiração configurável por tipo.
- Cupom / desconto por campanha.
```
