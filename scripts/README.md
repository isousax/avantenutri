# 📁 Scripts Directory

Este diretório contém scripts de build e manutenção do projeto.

## ✅ Scripts Essenciais (Produção)

### `generate-i18n-types.cjs`
- **Comando**: `npm run i18n:gen`
- **Função**: Gera tipos TypeScript automaticamente a partir das traduções modulares
- **Uso**: Executado automaticamente durante `npm run build`
- **Status**: 🔥 **CRÍTICO** - necessário para build

### `checkApiUsage.mjs`
- **Comando**: `npm run check:api` 
- **Função**: Verifica chaves de API não utilizadas no código
- **Uso**: Executado automaticamente no `prebuild`
- **Status**: ⚠️ **IMPORTANTE** - controle de qualidade

## 🛠️ Scripts de Manutenção

### `check-i18n.js`
- **Comando**: `npm run i18n:check`
- **Função**: Detecta strings hardcoded em português no código fonte
- **Uso**: Manual para verificar qualidade das traduções
- **Status**: ✅ **ÚTIL** - ferramenta de qualidade

### `generate-sitemap.mjs`
- **Comando**: `npm run sitemap`
- **Função**: Gera sitemap.xml dinamicamente com base nas rotas
- **Uso**: Manual para SEO e deploy
- **Status**: ✅ **ÚTIL** - SEO

## 📦 Archive

A pasta `archive/` contém scripts temporários usados durante a migração do sistema i18n:
- Scripts de extração de chaves de tradução
- Scripts de migração para sistema modular
- Scripts de correção de duplicatas
- Scripts de análise e limpeza

**Estes scripts podem ser removidos após confirmação de que o sistema i18n está estável.**

## 🔄 Pipeline de Build

```bash
npm run build
├── npm run check:api      # Verifica APIs não utilizadas
└── npm run i18n:gen       # Gera tipos TypeScript das traduções
    └── tsc -b             # Compilação TypeScript
        └── vite build     # Build final
```

## 📋 Comandos Úteis

```bash
# Desenvolvimento
npm run i18n:gen          # Regenerar tipos de tradução
npm run i18n:check        # Verificar strings hardcoded
npm run sitemap           # Gerar sitemap

# Build
npm run build             # Build completa com verificações
```