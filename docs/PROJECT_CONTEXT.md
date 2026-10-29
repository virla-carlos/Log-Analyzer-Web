# Log Analyzer — Project Context

Este documento fornece contexto técnico e funcional para desenvolvedores e assistentes de IA que forem trabalhar no projeto **Log Analyzer**.

Antes de implementar qualquer funcionalidade, considere as decisões, responsabilidades e restrições descritas neste documento.

---

# 1. Objetivo do projeto

O Log Analyzer é uma aplicação para análise de logs que identifica padrões recorrentes de alertas e apresenta essas informações de maneira visual e priorizada.

O principal público-alvo é uma equipe de suporte realizando a investigação inicial de incidentes.

O sistema deve ajudar a responder perguntas como:

```text
Quais alertas mais se repetem?

Quais padrões concentram a maior quantidade de ocorrências?

Quais padrões devem ser analisados primeiro?

Em quais períodos houve maior quantidade de alertas?

Quais componentes estão associados aos alertas?
```

O sistema não deve ser tratado como uma ferramenta que determina automaticamente a causa raiz de um incidente.

---

# 2. Escopo

Atualmente o sistema realiza análise de logs estruturados.

Ele:

```text
carrega o dataset
→ identifica alertas
→ agrupa padrões
→ calcula recorrência
→ calcula limites estatísticos
→ classifica prioridade
→ disponibiliza os resultados por API
→ apresenta os resultados em dashboard
```

Não fazem parte do escopo atual:

```text
correção automática de erros
diagnóstico automático de causa raiz
monitoramento em tempo real
execução de ações em sistemas externos
autenticação de usuários
controle de permissões
integração direta com sistemas corporativos
```

Não adicionar essas funcionalidades sem uma decisão explícita de mudança de escopo.

---

# 3. Arquitetura atual

A versão web utiliza a seguinte arquitetura:

```text
Dataset CSV
    ↓
Python
    ↓
Pandas
    ↓
src/main.py
    ↓
Flask
    ↓
src/server.py
    ↓
GET /api/analysis
    ↓
JSON
    ↓
public/app.js
    ↓
Chart.js
    ↓
Dashboard
```

Existe também uma versão desktop desenvolvida anteriormente utilizando:

```text
Python
Pandas
Tkinter
Matplotlib
```

A versão desktop representa o primeiro MVP.

A versão web é uma evolução da mesma solução.

---

# 4. Tecnologias

Backend:

```text
Python
Pandas
Flask
```

Frontend:

```text
HTML
CSS
JavaScript
Chart.js
```

Infraestrutura:

```text
Git
GitHub
Vercel
```

---

# 5. Estrutura principal do projeto web

A organização esperada é semelhante a:

```text
log-analyzer/
│
├── data/
│   └── sample/
│       └── dataset utilizado pela aplicação
│
├── public/
│   ├── assets/
│   │   └── logo.png
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── src/
│   ├── __init__.py
│   ├── main.py
│   └── server.py
│
├── requirements.txt
├── README.md
└── .gitignore
```

Antes de criar novos arquivos, verificar se a responsabilidade pode ser adicionada a algum módulo existente.

Evitar duplicação de lógica.

---

# 6. Responsabilidades dos arquivos

## src/main.py

Responsável pelo processamento e análise dos dados.

Deve conter a lógica relacionada a:

```text
leitura do dataset
filtros
agrupamentos
cálculos
prioridades
transformações com Pandas
```

A lógica de análise não deve ser implementada diretamente no frontend.

---

## src/server.py

Responsável pela camada Flask.

Sua função principal é:

```text
receber requisições HTTP
↓
chamar funções de análise
↓
converter os resultados
↓
retornar JSON
```

Endpoint principal:

```text
GET /api/analysis
```

O `server.py` não deve duplicar cálculos já existentes em `main.py`.

---

## public/app.js

Responsável por consumir a API e montar a interface dinâmica.

Fluxo:

```text
fetch("/api/analysis")
        ↓
JSON
        ↓
JavaScript
        ↓
KPIs
gráficos
tabela
filtros
interações
```

Em produção na Vercel, utilizar preferencialmente:

```javascript
fetch("/api/analysis")
```

Não deixar endereços como:

```text
http://127.0.0.1:5000
```

fixos no código enviado para produção.

---

## public/index.html

Responsável pela estrutura da página.

Evitar inserir lógica de processamento de dados diretamente no HTML.

---

## public/style.css

Responsável pela apresentação visual e responsividade.

Evitar misturar regras de negócio com estilização.

---

# 7. Dataset

O projeto foi desenvolvido utilizando a amostra estruturada do BGL:

```text
BGL_2k.log_structured.csv
```

Quantidade:

```text
2.000 registros
```

Distribuição original:

```text
1.857 registros normais
143 registros de alerta
```

Colunas:

```text
LineId
Label
Timestamp
Date
Node
Time
NodeRepeat
Type
Component
Level
Content
EventId
EventTemplate
```

---

# 8. Dataset demonstrativo

Foi criada uma versão experimental do dataset para tornar a demonstração mais próxima de situações encontradas em aplicações corporativas.

Foram modificadas somente as informações relacionadas às mensagens dos alertas:

```text
Content
EventTemplate
```

As demais informações estruturais foram preservadas.

Entre os padrões demonstrativos estão:

```text
Erro de sincronização com o SAP

Erro HTTP 500

Ordem não recebida no dispositivo

Usuário sem aparelho associado

Problema de conexão com a rede

Token expirado

Falha de autenticação

Falha no processamento de eventos

Dispositivo offline

Timeout de comunicação

Falha no envio de dados

Erro de consulta ao banco de dados

Serviço indisponível

Falha de atualização

Permissão insuficiente

Dados inválidos
```

Essas mensagens são sintéticas e não devem ser apresentadas como dados reais de uma empresa.

---

# 9. Significado das principais colunas

## Label

Determina se o registro é normal ou alerta.

```text
Label == "-"
→ registro normal

Label != "-"
→ alerta
```

---

## Content

Mensagem específica registrada naquela ocorrência.

Pode conter informações variáveis como:

```text
usuário
dispositivo
ordem
operação
requisição
```

---

## EventTemplate

Representa o padrão generalizado de uma mensagem.

Valores variáveis são representados por:

```text
<*>
```

Exemplo:

```text
Ordem <*> não recebida no dispositivo <*>
```

---

## EventId

Identificador associado ao padrão.

Não tratar `EventId` automaticamente como:

```text
código de erro
severidade
prioridade
```

Ele é um identificador do padrão.

---

## Level

Representa a severidade registrada no dataset.

Na amostra atual, os 143 alertas possuem:

```text
FATAL
```

Por isso a prioridade atual é determinada principalmente pela recorrência.

---

# 10. Agrupamento dos alertas

A análise principal agrupa registros utilizando:

```text
EventId
Level
EventTemplate
```

Depois é calculada a quantidade de ocorrências de cada grupo.

Resultado conceitual:

```text
EventId | EventTemplate | Occurrences
```

---

# 11. Prioridade

A prioridade é calculada utilizando a distribuição de `Occurrences`.

São calculados:

```text
Q50
Q75
```

Na amostra atual:

```text
Q50 = 3,5
Q75 = 8,25
```

Regra:

```text
Occurrences <= Q50
→ RISCO BAIXO

Occurrences > Q50 e <= Q75
→ RISCO MÉDIO

Occurrences > Q75
→ RISCO ALTO
```

Para o dataset atual isso equivale aproximadamente a:

```text
1–3
→ RISCO BAIXO

4–8
→ RISCO MÉDIO

9+
→ RISCO ALTO
```

Esses limites não devem ser tratados como valores universais.

Eles são calculados a partir do dataset.

---

# 12. Dados atuais da análise

O dataset contém:

```text
143 alertas

16 padrões agrupados
```

Principais recorrências:

```text
E55  → 59
E52  → 30
E29  → 9
E81  → 9
E32  → 8
E111 → 6
E60  → 5
E30  → 4
```

Os demais padrões possuem recorrências menores.

---

# 13. Análise por componente

Distribuição atual:

```text
KERNEL → 115 registros de alerta
APP    → 28 registros de alerta
```

Aproximadamente:

```text
KERNEL → 80,4%
APP    → 19,6%
```

Nunca afirmar que o componente é necessariamente a causa da falha.

Utilizar linguagem como:

```text
"alertas associados ao componente"
```

e não:

```text
"alertas causados pelo componente"
```

---

# 14. Dashboard atual

O dashboard apresenta:

```text
indicadores principais

ranking dos padrões mais recorrentes

limites Q50 e Q75

distribuição por prioridade

comparação entre quantidade de padrões e quantidade de registros

análise temporal

gráfico de Pareto

análise por componente

ranking completo em tabela

filtro por prioridade

pesquisa por padrão/EventId
```

---

# 15. Concentração dos alertas

Uma das análises importantes demonstra que poucos padrões concentram grande quantidade de ocorrências.

Atualmente:

```text
4 padrões de RISCO ALTO
```

representam aproximadamente:

```text
25% dos padrões
```

mas concentram:

```text
107 de 143 registros
≈ 75% dos alertas
```

Essa informação deve ser utilizada como apoio à priorização de investigação.

---

# 16. Pareto

A aplicação também utiliza uma análise de Pareto.

Atualmente:

```text
aproximadamente 5 de 16 padrões
```

concentram:

```text
cerca de 80% dos registros de alerta
```

O objetivo é mostrar que uma pequena quantidade de padrões concentra grande parte das ocorrências.

---

# 17. Comunicação frontend/backend

O frontend não acessa diretamente o CSV.

O fluxo correto é:

```text
CSV
↓
Pandas
↓
Flask
↓
API
↓
JSON
↓
JavaScript
↓
interface
```

O JavaScript consome a API utilizando `fetch()`.

---

# 18. API

Endpoint principal:

```text
GET /api/analysis
```

A resposta contém dados necessários para:

```text
ranking
Q50
Q75
total de alertas
análises adicionais
gráficos
tabela
```

Sempre que possível, cálculos devem ser realizados no backend e enviados ao frontend já estruturados.

Não duplicar cálculos importantes em Python e JavaScript sem necessidade.

---

# 19. Execução local

Backend:

```bash
python -m src.server
```

Executado normalmente em:

```text
http://127.0.0.1:5000
```

API:

```text
http://127.0.0.1:5000/api/analysis
```

Frontend:

```bash
python -m http.server 5500 -d public
```

Executado em:

```text
http://127.0.0.1:5500
```

Como são portas diferentes, durante testes locais podem existir restrições de CORS.

Não enviar configurações específicas de `127.0.0.1` para produção sem necessidade.

---

# 20. Produção

A aplicação é hospedada na Vercel.

Em produção, o frontend deve utilizar:

```javascript
fetch("/api/analysis")
```

Assim a chamada utiliza o mesmo domínio em que a aplicação está hospedada.

---

# 21. Regras para implementar novas funcionalidades

Antes de modificar o projeto:

```text
1. Entender qual problema a funcionalidade resolve.

2. Verificar se ela faz parte do escopo atual.

3. Não alterar arquitetura, tecnologias ou escopo sem necessidade.

4. Implementar primeiro a lógica de análise no backend quando envolver dados.

5. Evitar lógica de negócio no HTML ou CSS.

6. Evitar duplicar processamento entre Python e JavaScript.

7. Manter compatibilidade com as funcionalidades existentes.

8. Não remover gráficos, métricas ou filtros existentes sem solicitação explícita.

9. Não modificar o formato do dataset sem avaliar impacto sobre o processamento existente.

10. Preservar a compatibilidade com a Vercel.

11. Não adicionar bibliotecas desnecessárias.

12. Explicar alterações arquiteturais antes de implementá-las.
```

---

# 22. Orientação para assistentes de IA

Ao receber uma solicitação para implementar uma funcionalidade neste projeto:

Primeiro analise a arquitetura existente.

Não reescreva todo o projeto se a funcionalidade puder ser incorporada à estrutura atual.

Não substitua tecnologias existentes sem justificativa.

Não altere funcionalidades que não estejam relacionadas à solicitação.

Sempre informe quais arquivos precisam ser modificados.

Quando uma nova análise de dados for necessária, priorize:

```text
Python
↓
Pandas
↓
função reutilizável
↓
API
↓
frontend
```

Preserve a separação:

```text
main.py
→ análise

server.py
→ API

app.js
→ interface e visualização

index.html
→ estrutura

style.css
→ aparência
```

---

# 23. Estado atual do projeto

O projeto encontra-se funcional.

A versão web consegue:

```text
carregar o dataset
analisar os alertas
agrupar os padrões
calcular recorrência
calcular prioridades
expor os dados pela API
renderizar gráficos
apresentar indicadores
permitir filtros
permitir pesquisa
exibir ranking detalhado
```

Novas funcionalidades devem ser adicionadas incrementalmente, preservando o funcionamento atual.

---

# 24. Objetivo de longo prazo

O projeto pode evoluir futuramente para incluir:

```text
novos datasets
logs brutos
parser automático
Drain
SQL
persistência
novas análises estatísticas
detecção de anomalias
machine learning
IA
relatórios
integração com sistemas externos
monitoramento em tempo real
```

Esses itens representam possibilidades futuras e não devem ser considerados funcionalidades já implementadas.