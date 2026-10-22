<div align="center">

# 📊 Big Data Log Analyzer Web

### Análise e priorização de padrões recorrentes em grandes volumes de logs

Projeto desenvolvido em **Python** para transformar registros de logs em informações úteis para equipes de suporte, facilitando a identificação de alertas recorrentes, a priorização de incidentes e a visualização dos dados através de um dashboard web.

![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Analysis-150458?logo=pandas)
![Flask](https://img.shields.io/badge/Flask-API-000000?logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-Visualization-FF6384?logo=chartdotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel)
![Status](https://img.shields.io/badge/status-v0.1%20em%20desenvolvimento-yellow)

</div>

---

## 🎯 Sobre o projeto

Sistemas e aplicações podem gerar milhares ou milhões de registros de log durante sua execução.

Em cenários de suporte e investigação de incidentes, analisar manualmente grandes volumes desses registros pode dificultar a identificação dos erros mais recorrentes e tornar o diagnóstico inicial mais demorado.

O **Big Data Log Analyzer** foi desenvolvido para auxiliar nesse processo.

A aplicação identifica registros classificados como alerta, agrupa padrões semelhantes, calcula sua recorrência e apresenta os resultados de forma visual através de um dashboard web.

O objetivo não é substituir a análise humana nem diagnosticar automaticamente a causa raiz de um incidente, mas fornecer informações que ajudem equipes de suporte e desenvolvimento a direcionarem melhor suas investigações.

---

## ✨ Funcionalidades

A versão atual da aplicação permite:

- Identificar registros classificados como alerta;
- Agrupar alertas por padrão;
- Calcular a quantidade de ocorrências;
- Ordenar padrões pela recorrência;
- Calcular os quartis Q50 e Q75;
- Classificar padrões em níveis de prioridade;
- Exibir indicadores gerais da análise;
- Visualizar gráficos interativos;
- Consultar o ranking completo dos padrões;
- Filtrar resultados por prioridade;
- Pesquisar por `EventId` ou `EventTemplate`;
- Ordenar os dados diretamente pela tabela.

---

## 🧠 Fluxo da aplicação

```text
Dataset BGL
      ↓
Python
      ↓
Pandas
      ↓
Filtragem dos alertas
      ↓
Agrupamento dos padrões
      ↓
Contagem das ocorrências
      ↓
Cálculo de Q50 e Q75
      ↓
Classificação de prioridade
      ↓
Flask API
      ↓
JSON
      ↓
JavaScript
      ↓
Chart.js
      ↓
Dashboard Web
```

A lógica de análise permanece no back-end em Python, enquanto o front-end é responsável pela apresentação e interação com os resultados.

---

## 📊 Dataset

O projeto utiliza o **BGL (Blue Gene/L)**, disponibilizado através do LogHub.

O dataset completo possui aproximadamente:

```text
4,7 milhões de registros
≈ 708 MiB
```

Para o desenvolvimento e validação inicial da aplicação é utilizada a amostra estruturada:

```text
BGL_2k.log_structured.csv
```

contendo:

```text
2.000 registros
```

A utilização dessa amostra permite desenvolver e validar o fluxo da aplicação antes da evolução para volumes maiores de dados.

---

## 🔎 Principais campos utilizados

| Campo | Descrição |
|---|---|
| `Label` | Classificação do registro |
| `EventId` | Identificador associado a determinado padrão de log |
| `EventTemplate` | Representação generalizada da mensagem |
| `Level` | Nível de severidade |
| `Component` | Componente responsável pelo evento |
| `Date` | Data associada ao registro |
| `Content` | Mensagem original do log |
| `Node` | Nó ou máquina relacionado ao evento |

No dataset utilizado:

```text
Label = "-"
```

representa um evento normal.

Registros com valores diferentes de `-` são tratados pela aplicação como alertas.

---

## 🧩 EventId e EventTemplate

O `EventId` funciona como identificador de determinado padrão de mensagem.

Ele não representa necessariamente um código de erro ou um nível de severidade.

O `EventTemplate` representa uma forma generalizada da mensagem de log.

Por exemplo:

```text
socket to 10.0.0.1:5000
socket to 10.0.0.2:6000
```

podem ser representados por um padrão semelhante a:

```text
socket to <*>
```

Isso permite agrupar mensagens que possuem valores diferentes, mas seguem a mesma estrutura.

Na versão atual, `EventId` e `EventTemplate` já são fornecidos pelo dataset estruturado.

---

## 🚨 Classificação de prioridade

Após identificar os padrões, a aplicação calcula quantas vezes cada padrão ocorreu.

Em seguida são calculados:

```text
Q50 → mediana da distribuição das ocorrências

Q75 → terceiro quartil da distribuição
```

A regra utilizada atualmente é:

```text
Ocorrências <= Q50
→ RISCO BAIXO

Ocorrências > Q50 e <= Q75
→ RISCO MÉDIO

Ocorrências > Q75
→ RISCO ALTO
```

Na amostra atual, os registros classificados como alerta possuem nível `FATAL`.

Por isso, a prioridade nesta versão é diferenciada principalmente pela **recorrência dos padrões**.

Como evolução, a aplicação poderá utilizar:

```text
recorrência + severidade
```

para produzir uma classificação mais completa.

---

## 📈 Resultados da amostra atual

Na amostra utilizada:

```text
2.000 registros analisados
```

Foram encontrados:

```text
1.857 registros normais
143 registros de alerta
```

Após o agrupamento:

```text
16 padrões de alerta
```

O padrão mais recorrente identificado foi:

```text
EventId: E55
Ocorrências: 59
```

seguido por:

```text
EventId: E52
Ocorrências: 30
```

O `E55` representa aproximadamente:

```text
41,26%
```

dos registros classificados como alerta.

Os limites calculados foram:

```text
Q50 = 3,5
Q75 = 8,25
```

---

## 📊 Dashboard

O dashboard apresenta indicadores gerais da análise, incluindo:

- Total de registros de alerta;
- Quantidade de padrões identificados;
- Valor de Q50;
- Valor de Q75;
- Percentual dos alertas concentrados no padrão mais recorrente.

Além dos indicadores, diferentes gráficos permitem explorar os resultados.

---

## 📉 Visualizações

### 1. Padrões que mais se repetem

Gráfico de barras horizontal que compara:

```text
EventId × Ocorrências
```

As cores representam a prioridade atribuída ao padrão.

Também são apresentadas linhas de referência para:

```text
Q50
Q75
```

---

### 2. Peso de cada prioridade

Gráfico em formato de rosca que mostra a quantidade de registros pertencentes aos padrões classificados como:

```text
RISCO ALTO
RISCO MÉDIO
RISCO BAIXO
```

Também é exibida a quantidade de padrões em cada categoria.

---

### 3. Análise de Pareto

O gráfico combina:

```text
Quantidade de ocorrências
+
Percentual acumulado
```

permitindo observar quantos padrões concentram a maior parte dos registros de alerta.

Essa visualização auxilia na identificação dos padrões que podem merecer maior atenção durante uma investigação.

---

### 4. Distribuição das ocorrências

Apresenta a quantidade de padrões existente em diferentes faixas de recorrência.

A visualização ajuda a compreender a distribuição utilizada na análise dos quartis Q50 e Q75.

---

### 5. Alertas por data

Gráfico temporal mostrando a quantidade de registros de alerta em cada data disponível no dataset.

Essa análise permite identificar possíveis concentrações de alertas ao longo do tempo.

---

### 6. Alertas por componente

Apresenta os componentes responsáveis pela maior quantidade de registros classificados como alerta.

Isso permite identificar quais componentes aparecem com maior frequência na amostra analisada.

---

## 🔍 Ranking dos alertas

Além das visualizações, o dashboard possui uma tabela contendo:

| Campo | Descrição |
|---|---|
| `EventId` | Identificador do padrão |
| `Level` | Severidade do registro |
| `EventTemplate` | Padrão da mensagem |
| `Occurrences` | Quantidade de ocorrências |
| `Priority` | Classificação de prioridade |

A interface permite:

- Ordenar as colunas;
- Pesquisar por `EventId`;
- Pesquisar por `EventTemplate`;
- Filtrar por prioridade;
- Visualizar proporcionalmente a recorrência de cada padrão.

---

## 🏗️ Arquitetura

```text
bigdata-log-analyzer-web/
│
├── data/
│   └── sample/
│       └── BGL_2k.log_structured.csv
│
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
│
├── src/
│   ├── __init__.py
│   ├── main.py
│   └── server.py
│
├── .gitignore
├── README.md
└── requirements.txt
```

---

## 🐍 `src/main.py`

Responsável pela análise dos dados utilizando Pandas.

Suas principais responsabilidades são:

- Carregar o dataset;
- Filtrar registros de alerta;
- Agrupar padrões;
- Contar ocorrências;
- Calcular Q50 e Q75;
- Classificar prioridades;
- Gerar o ranking final.

---

## 🌐 `src/server.py`

Responsável pela comunicação entre o processamento Python e a interface web.

Utiliza **Flask** para disponibilizar os resultados através do endpoint:

```text
GET /api/analysis
```

O resultado da análise é convertido para JSON e enviado ao navegador.

---

## 🖥️ `public/index.html`

Define a estrutura do dashboard.

---

## 🎨 `public/style.css`

Responsável pela aparência, responsividade e organização visual da aplicação.

---

## ⚙️ `public/app.js`

Responsável pela interação da interface.

Entre suas funções estão:

- Consumir a API Flask;
- Receber os resultados em JSON;
- Criar os gráficos;
- Preencher os indicadores;
- Criar a tabela;
- Aplicar filtros;
- Realizar buscas;
- Ordenar os resultados.

---

## 🔄 Comunicação entre Front-end e Back-end

Quando o usuário solicita uma análise, o JavaScript executa:

```javascript
fetch("/api/analysis")
```

A requisição chega ao Flask:

```text
GET /api/analysis
```

O fluxo então é:

```text
app.js
   ↓
Flask
   ↓
server.py
   ↓
generate_analysis()
   ↓
main.py
   ↓
Pandas
   ↓
JSON
   ↓
Dashboard
```

Isso significa que os valores apresentados no dashboard não ficam definidos manualmente no HTML.

Eles são obtidos a partir da análise realizada pelo back-end.

---

## 🛠️ Tecnologias utilizadas

### Back-end

- Python
- Flask

### Análise de dados

- Pandas

### Front-end

- HTML5
- CSS3
- JavaScript

### Visualização de dados

- Chart.js

### Ferramentas

- Git
- GitHub
- Vercel

---

## 🚀 Executando localmente

### 1. Clone o repositório

```bash
git clone https://github.com/virla-carlos/bigdata-log-analyzer-web.git
```

Entre na pasta:

```bash
cd bigdata-log-analyzer-web
```

---

### 2. Crie o ambiente virtual

```bash
python -m venv .venv
```

---

### 3. Ative o ambiente

No Windows:

```bash
.venv\Scripts\activate
```

---

### 4. Instale as dependências

```bash
pip install -r requirements.txt
```

Ou:

```bash
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

---

### 5. Execute a API

```bash
python src/server.py
```

Ou:

```bash
.\.venv\Scripts\python.exe .\src\server.py
```

A API ficará disponível em:

```text
http://127.0.0.1:5000/api/analysis
```

---

## ☁️ Deploy

A versão web está preparada para deploy utilizando **Vercel**.

O fluxo de publicação é:

```text
Código local
     ↓
Git
     ↓
GitHub
     ↓
Vercel
     ↓
Build
     ↓
Aplicação publicada
```

Após conectar o projeto da Vercel ao repositório GitHub, novos pushes podem gerar automaticamente novos deployments.

---

## 🔄 Fluxo de desenvolvimento

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push
```

Após o `push`, o GitHub recebe a nova versão e a plataforma de hospedagem pode iniciar um novo deployment.

---

## ⚠️ Limitações atuais

A versão atual:

- Utiliza inicialmente a amostra BGL com 2.000 registros;
- Ainda não executa o processamento do dataset completo na aplicação web;
- Utiliza `EventId` e `EventTemplate` previamente estruturados;
- Não gera templates diretamente dos logs brutos;
- Não realiza monitoramento em tempo real;
- Não realiza diagnóstico automático de causa raiz;
- Não executa correções no sistema analisado;
- Baseia a prioridade principalmente na recorrência;
- Ainda não possui integração com banco de dados.

---

## 🗺️ Próximas evoluções

Possíveis melhorias futuras:

- Processamento do dataset BGL completo;
- Leitura direta dos arquivos de log brutos;
- Geração automática de `EventTemplate`;
- Upload de arquivos pela interface;
- Integração com banco de dados SQL;
- Análises temporais mais avançadas;
- Combinação entre recorrência e severidade;
- Processamento de diferentes datasets;
- Aplicação de técnicas de Machine Learning;
- Utilização de Inteligência Artificial para auxiliar na interpretação dos padrões.

---

## 🎯 Visão futura

Uma evolução possível é transformar o projeto em uma ferramenta onde equipes de suporte possam enviar arquivos de log e receber:

```text
Resumo da análise
+
Padrões mais recorrentes
+
Alertas prioritários
+
Visualizações
+
Evidências para investigação
```

facilitando a análise inicial de incidentes sem substituir a decisão humana.

---

## 🎓 Contexto acadêmico

Projeto desenvolvido para a disciplina de:

**Tópicos de Big Data em Python**

O desenvolvimento também busca aplicar práticas próximas a um projeto real de software:

- Discovery;
- Definição do problema;
- Planejamento;
- Definição de MVP;
- Versionamento com Git;
- Separação de responsabilidades;
- Desenvolvimento incremental;
- Análise de dados;
- Visualização;
- Documentação;
- Deploy da aplicação.

---

<div align="center">

### 📌 Versão atual

![Version](https://img.shields.io/badge/version-Web%20v0.1-blue)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

**Dataset → Pandas → Análise → Priorização → Flask → API → Dashboard**

</div>
