# 🚀 ACE — AutoSales Campaign Engine

Plataforma inteligente de inteligência comercial sazonal, automação de campanhas de marketing impulsionadas por IA e monitoramento analítico em tempo real integrado ao **Instagram Graph API** e **Supabase PostgreSQL**.

---

## 🎯 Sobre o Projeto

O **ACE (AutoSales Campaign Engine)** foi desenvolvido para transformar oportunidades sazonais e datas comemorativas em campanhas de alta conversão. A aplicação analisa o calendário de oportunidade de mercado, gera sugestões criativas e peças publicitárias com Inteligência Artificial (OpenAI / Gemini / Cloudinary), dispara automaticamente publicações para o feed do Instagram e monitora a performance e o engajamento com Live Analytics.

---

## 🛠️ Stack Tecnológica

### **Frontend**
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Estilização**: Tailwind CSS (Design Responsivo, Dark Mode, Micro-animações e Glassmorphism)
- **Ícones & Componentes**: Lucide React, Framer Motion

### **Backend**
- **Linguagem & Framework**: Python 3.12 + [FastAPI](https://fastapi.tiangolo.com/)
- **ORM & Banco de Dados**: SQLAlchemy ORM + [Supabase](https://supabase.com/) PostgreSQL
- **Validação de Dados**: Pydantic v2
- **Servidor ASGI**: Uvicorn

### **Integradores & APIs de IA**
- **Meta Graph API v25.0**: Publicação automatizada no Instagram Feed e extração de métricas de engajamento (curtidas, alcance, impressões e comentários).
- **OpenAI & Google Gemini**: Geração inteligente de legendarização (copys), headlines e estratégia visual.
- **Cloudinary**: Hospedagem e gerenciamento otimizado de mídias e artes das campanhas.

## ✨ Módulos Principais

### 1. 🎯 **Radar de Oportunidades**
- Visualização de oportunidades de mercado, feriados nacionais e eventos sazonais.
- **CRUD Completo Conectado ao Supabase**: Permite criar novas oportunidades, editar datas/descrições e excluir eventos diretamente na interface.

### 2. 🤖 **Gerador IA de Campanhas**
- Seleção de opções visuais e geração automatizada de headlines, copys e cupons promocionais personalizados via inteligência artificial.

### 3. 🚀 **Aprovação & Publicação Automatizada**
- Pré-visualização do post em um Mockup interativo do Instagram.
- Publicação imediata no feed via **Instagram Graph API** com salvamento automático do registro na tabela `campaigns` do Supabase.

### 4. 📊 **Live Analytics & Métricas do Post**
- **Visão Macro da Conta**: Visualizações globais, contas alcançadas, visitas ao perfil e total de seguidores.
- **Métricas do Post com Histórico**: Seletor dinâmico para consultar o engajamento individual (curtidas, alcance dedicado e lista de comentários reais) de publicações passadas salvas no Supabase.

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- **Node.js**: v18.0.0 ou superior
- **Python**: v3.11 ou superior
- **Conta Supabase & Meta Developers** (com permissões de Instagram Graph API)

### 1. Clone o repositório
```bash
git clone https://github.com/melzinhoinova/ACE-project.git
cd ACE-project
```

### 2. Configuração do Backend (FastAPI)
Navegue até a pasta `Backend`, crie um ambiente virtual e instale as dependências:

```bash
cd Backend
python -m venv .venv
# Ativação no Windows:
.venv\Scripts\activate
# Ativação no Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configuração do Frontend (Next.js)
Em outro terminal, navegue até a pasta `Frontend` e instale as dependências:

```bash
cd Frontend
npm install
npm run dev
```
> O frontend estará rodando em: `http://localhost:3000`

---

## 📄 Licença

Este projeto é desenvolvido para fins comerciais e educacionais no contexto da iniciativa **InovaSkill 2026**.
