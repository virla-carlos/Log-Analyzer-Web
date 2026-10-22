<div align="center">

# 📊 Big Data Log Analyzer

### Análise e priorização de padrões recorrentes em grandes volumes de logs

Projeto desenvolvido em **Python** para transformar registros de logs em informações úteis para equipes de suporte, facilitando a identificação de alertas recorrentes e a priorização de incidentes.

![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Analysis-150458?logo=pandas)
![NumPy](https://img.shields.io/badge/NumPy-Numerical%20Analysis-013243?logo=numpy)
![Matplotlib](https://img.shields.io/badge/Matplotlib-Visualization-orange)
![Status](https://img.shields.io/badge/status-v0.1%20em%20desenvolvimento-yellow)

</div>

---

## 📌 Sobre o projeto

Aplicações podem gerar milhares ou milhões de registros de log durante sua execução.

Para uma equipe de suporte, analisar manualmente esse volume de informações pode dificultar a identificação de falhas recorrentes, atrasar a investigação de incidentes e tornar mais demorado o encaminhamento de informações para desenvolvedores e usuários.

O **Big Data Log Analyzer** busca transformar esses registros em informações mais fáceis de interpretar.

A aplicação analisa os logs, identifica registros classificados como alerta, agrupa eventos semelhantes, calcula sua recorrência e atribui uma prioridade de análise.

### Fluxo simplificado

```text
Milhares de registros de log
            ↓
Identificação dos alertas
            ↓
Agrupamento por padrão
            ↓
Cálculo da recorrência
            ↓
Classificação de prioridade
            ↓
Ranking de alertas
            ↓
Visualizações e apoio à análise
```

> O objetivo da aplicação não é corrigir automaticamente falhas nem substituir a análise realizada pelas equipes de suporte e desenvolvimento.

---

## 🎯 Objetivo

Desenvolver uma solução capaz de processar grandes volumes de logs e facilitar a identificação de padrões recorrentes de alerta.

A aplicação deverá permitir que a equipe de suporte consiga identificar:

- quais alertas estão ocorrendo;
- quais padrões aparecem com maior frequência;
- quantas vezes cada padrão ocorreu;
- qual o nível de severidade associado;
- quais alertas devem receber maior atenção;
- quais informações podem auxiliar na investigação do incidente.

---

## 👥 Público-alvo

### Principal

**Equipe de suporte técnico**, responsável pela análise inicial de incidentes.

### Secundário

**Equipe de desenvolvimento**, que poderá utilizar os padrões encontrados como apoio durante investigações técnicas.

---

# 🗃️ Dataset

O dataset escolhido para o projeto foi o **BGL (Blue Gene/L)**, disponibilizado pelo projeto [LogHub](https://github.com/logpai/loghub).

O conjunto contém registros coletados de um supercomputador Blue Gene/L e é utilizado em pesquisas relacionadas à análise de logs, detecção de anomalias e falhas.

### Dataset completo

| Característica | Valor |
|---|---:|
| Registros | **4.747.963** |
| Tamanho bruto | **~708,76 MiB** |
| Período aproximado | **214,7 dias** |
| Formato | Log bruto |
| Possui classificação de alertas | ✅ |

No BGL:

```text
Label = "-"  → registro não classificado como alerta

Label != "-" → registro classificado como alerta
```

---

## 🧪 Dataset utilizado na v0.1

Durante o desenvolvimento inicial está sendo utilizada a amostra:

```text
BGL_2k.log_structured.csv
```

Ela contém:

| Informação | Quantidade |
|---|---:|
| Registros | **2.000** |
| Colunas | **13** |
| Registros normais | **1.857** |
| Alertas | **143** |

A utilização da amostra permite desenvolver e validar a lógica da aplicação antes de realizar os testes com os **4,7 milhões de registros** do dataset completo.

> Os datasets não são versionados no repositório. Os arquivos devem ser adicionados localmente em `data/raw/`.

---

# 🔎 Estrutura dos dados

Alguns dos principais campos utilizados durante a análise são:

| Campo | Função |
|---|---|
| `Label` | Identifica se o registro foi classificado como alerta |
| `Timestamp` | Momento do evento |
| `Date` | Data do registro |
| `Node` | Nó onde o evento ocorreu |
| `Component` | Componente responsável pela mensagem |
| `Level` | Severidade do evento |
| `Content` | Mensagem original registrada |
| `EventId` | Identificador do padrão do evento |
| `EventTemplate` | Representação genérica da mensagem |

### Exemplo

Diferentes mensagens podem representar o mesmo tipo de evento:

```text
socket to 172.16.96.116:33399
socket to 172.16.96.116:33569
socket to 172.16.96.116:33231
```

Essas ocorrências podem ser representadas por um padrão:

```text
socket to <*>
```

Dessa forma, a aplicação consegue analisar a **recorrência do padrão**, mesmo quando partes da mensagem variam.

---

# ⚙️ Fluxo de processamento

```text
BGL
 │
 ▼
Leitura dos registros
 │
 ▼
Estruturação com Pandas
 │
 ▼
Identificação de alertas
 │
 ▼
Agrupamento por EventId
 │
 ▼
EventTemplate + Level
 │
 ▼
Contagem de ocorrências
 │
 ▼
Análise da distribuição
 │
 ▼
Classificação de prioridade
 │
 ▼
Ranking dos alertas
 │
 ▼
Visualizações
```

---

# 🚨 Priorização dos alertas

Os alertas são agrupados considerando:

```text
EventId
+
Level
+
EventTemplate
```

A quantidade de registros pertencentes ao mesmo padrão é armazenada na coluna:

```text
Occurrences
```

Na versão atual, a distribuição dessas ocorrências é utilizada para definir os limites de prioridade.

São utilizados:

```text
Q50 → mediana
Q75 → terceiro quartil
```

A classificação inicial funciona da seguinte forma:

```text
Occurrences <= Q50
        ↓
   RISCO BAIXO


Q50 < Occurrences <= Q75
        ↓
   RISCO MÉDIO


Occurrences > Q75
        ↓
    RISCO ALTO
```

Na amostra utilizada atualmente:

```text
Q50 = 3.5
Q75 = 8.25
```

Exemplo:

| EventId | Level | Ocorrências | Prioridade |
|---|---|---:|---|
| `E55` | FATAL | 59 | 🔴 Risco Alto |
| `E52` | FATAL | 30 | 🔴 Risco Alto |
| `E29` | FATAL | 9 | 🔴 Risco Alto |
| `E32` | FATAL | 8 | 🟡 Risco Médio |
| `E30` | FATAL | 4 | 🟡 Risco Médio |
| `E33` | FATAL | 3 | 🟢 Risco Baixo |

> Na amostra `BGL_2k`, todos os registros classificados como alerta possuem `Level = FATAL`. Por isso, na v0.1 a recorrência é o principal fator de diferenciação da prioridade.

A estratégia deverá evoluir quando forem utilizados dados com diferentes níveis de severidade.

---

# 🧰 Tecnologias

### Core

| Tecnologia | Utilização |
|---|---|
| 🐍 **Python** | Linguagem principal |
| 🐼 **Pandas** | Estruturação, filtragem, agrupamento e análise dos logs |
| 🔢 **NumPy** | Operações numéricas e estatísticas |
| 📊 **Matplotlib** | Visualização dos resultados |

### Tecnologias em avaliação

- **SQL** — persistência dos resultados processados;
- **Parser de logs** — processamento do BGL bruto e geração de padrões;
- **FastAPI** — possível disponibilização dos resultados através de API;
- **Machine Learning** — análises futuras de similaridade ou comportamento anômalo.

Essas tecnologias não são requisitos obrigatórios para a primeira versão.

---

# 🚀 Status da v0.1

### Implementado

- [x] Leitura do `BGL_2k.log_structured.csv`
- [x] Validação da estrutura do dataset
- [x] Análise inicial com Pandas
- [x] Identificação dos registros classificados como alerta
- [x] Separação entre registros normais e alertas
- [x] Agrupamento de alertas por padrão
- [x] Contagem da recorrência
- [x] Análise da distribuição das ocorrências
- [x] Classificação inicial de prioridade

### Em desenvolvimento

- [ ] Ordenação e apresentação do ranking final
- [ ] Criação das primeiras visualizações
- [ ] Testes do fluxo completo
- [ ] Finalização da documentação da v0.1

---

# 📁 Estrutura do projeto

```text
bigdata-log-analyzer/
│
├── data/
│   └── raw/
│       └── BGL_2k.log_structured.csv
│
├── outputs/
│
├── src/
│   └── main.py
│
├── .gitignore
├── README.md
└── requirements.txt
```

### Diretórios locais

Os seguintes conteúdos não são enviados para o GitHub:

```text
.venv/
data/raw/*
```

O ambiente virtual e o dataset devem ser preparados localmente em cada máquina.

---

# ▶️ Executando o projeto

## 1. Clone o repositório

```bash
git clone https://github.com/virla-carlos/bigdata-log-analyzer
cd bigdata-log-analyzer
```

---

## 2. Crie o ambiente virtual

```bash
python -m venv .venv
```

### Windows PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

Caso a execução de scripts esteja bloqueada, também é possível utilizar diretamente o Python do ambiente virtual:

```powershell
.\.venv\Scripts\python.exe --version
```

---

## 3. Instale as dependências

```bash
python -m pip install -r requirements.txt
```

Ou diretamente pelo ambiente virtual:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

---

## 4. Adicione o dataset

Faça o download da amostra do BGL através do projeto LogHub e coloque:

```text
BGL_2k.log_structured.csv
```

em:

```text
data/raw/BGL_2k.log_structured.csv
```

---

## 5. Execute

```powershell
.\.venv\Scripts\python.exe .\src\main.py
```

---

# 🧭 Roadmap

### v0.1

```text
Leitura
  ↓
Alertas
  ↓
Recorrência
  ↓
Prioridade
  ↓
Ranking
  ↓
Visualização
```

### Próximas etapas

- [ ] Finalizar ranking dos padrões de alerta
- [ ] Criar gráficos com Matplotlib
- [ ] Melhorar a estratégia de prioridade
- [ ] Refatorar e separar responsabilidades do código
- [ ] Criar testes automatizados
- [ ] Processar o arquivo BGL bruto
- [ ] Implementar estratégia de parsing
- [ ] Validar com o dataset completo
- [ ] Avaliar persistência utilizando SQL
- [ ] Avaliar API utilizando FastAPI
- [ ] Investigar possíveis aplicações de Machine Learning

---

# 🚫 Fora do escopo atual

A primeira versão não pretende:

- corrigir automaticamente falhas;
- determinar de forma garantida a causa raiz;
- realizar alterações na aplicação analisada;
- executar ações automáticas em ambientes externos;
- monitorar logs continuamente em tempo real;
- integrar diretamente sistemas corporativos;
- substituir a análise realizada pelas equipes técnicas.

O projeto funciona como uma **ferramenta de apoio à análise de incidentes**.

---

# 🎓 Contexto acadêmico

Projeto desenvolvido para a disciplina de:

**Tópicos de Big Data em Python**

O objetivo acadêmico é aplicar conceitos relacionados a:

- análise de dados;
- processamento de grandes volumes de registros;
- tratamento de dados com Pandas;
- operações numéricas com NumPy;
- visualização com Matplotlib;
- desenvolvimento de uma solução baseada em um problema real.

---

<div align="center">

### Big Data Log Analyzer

**Transformando milhões de registros em informações úteis para análise de incidentes.**

</div>
