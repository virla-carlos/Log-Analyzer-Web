# Log Analyzer

## 1. Visão geral

O **Log Analyzer** é uma aplicação desenvolvida para auxiliar na análise de grandes volumes de logs, identificando padrões de alertas recorrentes e apresentando essas informações de maneira organizada, visual e priorizada.

O sistema foi pensado principalmente para apoiar equipes de suporte durante a investigação inicial de incidentes.

Em aplicações que geram milhares ou milhões de registros, analisar logs manualmente pode tornar o diagnóstico demorado. O Log Analyzer busca reduzir esse esforço ao transformar os registros em informações que permitam identificar rapidamente quais tipos de alerta aparecem com maior frequência e onde a investigação pode ser concentrada.

O objetivo da aplicação não é corrigir falhas automaticamente nem determinar de forma definitiva a causa raiz de um incidente. Sua função é atuar como uma ferramenta de apoio à análise.

---

# 2. Problema que o sistema busca resolver

Sistemas e aplicações podem gerar uma grande quantidade de logs durante sua execução.

Dentro desses registros podem existir mensagens normais, avisos e falhas relacionadas a diferentes componentes da aplicação.

Quando o volume de registros aumenta, algumas dificuldades aparecem:

- identificar quais erros estão ocorrendo com maior frequência;
- descobrir padrões de falha recorrentes;
- diferenciar ocorrências isoladas de problemas repetitivos;
- localizar períodos com maior concentração de alertas;
- identificar componentes relacionados às ocorrências;
- priorizar quais problemas devem ser analisados primeiro;
- reunir informações úteis para encaminhar o incidente ao time de desenvolvimento.

O Log Analyzer organiza essas informações automaticamente.

---

# 3. Objetivo do sistema

O objetivo principal é:

> Processar registros de logs, identificar e agrupar padrões recorrentes de alertas e apresentar essas informações de forma analítica e visual, auxiliando a equipe de suporte na investigação inicial de incidentes.

O sistema transforma um conjunto de registros individuais em uma visão resumida dos principais problemas encontrados.

Um cenário simplificado seria:

```text
Milhares de registros de log
        ↓
Identificação dos alertas
        ↓
Agrupamento de mensagens semelhantes
        ↓
Contagem das ocorrências
        ↓
Definição de prioridade
        ↓
Dashboard analítico
        ↓
Apoio à investigação
```

---

# 4. Tecnologias utilizadas

A versão web do sistema utiliza:

### Backend

- Python
- Pandas
- Flask

### Frontend

- HTML
- CSS
- JavaScript
- Chart.js

### Hospedagem

- GitHub para versionamento do projeto;
- Vercel para hospedagem da aplicação web.

A versão inicial do projeto também possui uma aplicação desktop desenvolvida utilizando:

- Python;
- Pandas;
- Tkinter;
- Matplotlib.

A versão desktop foi utilizada como primeiro MVP da solução, enquanto a versão web representa uma evolução da interface e da arquitetura do sistema.

---

# 5. Dataset

O projeto utiliza como base o dataset **BGL — Blue Gene/L**, disponibilizado pelo LogHub.

Durante o desenvolvimento é utilizada a amostra estruturada:

```text
BGL_2k.log_structured.csv
```

Ela possui:

```text
2.000 registros
```

e contém informações como:

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

Na amostra utilizada pelo sistema existem:

```text
2.000 registros totais

1.857 registros normais

143 registros classificados como alertas
```

---

# 6. Estrutura dos registros

Algumas colunas possuem papel especialmente importante na aplicação.

## Label

A coluna `Label` permite identificar se determinado registro é considerado normal ou alerta.

No dataset utilizado:

```text
"-"
```

representa um registro normal.

Outros valores representam categorias de alerta.

O sistema utiliza essa informação para separar os registros relevantes para análise.

---

## Content

`Content` representa a mensagem original registrada no log.

Exemplo:

```text
Ordem ORD-101250 não recebida no dispositivo DISP-1250
```

Essa mensagem pode conter informações específicas daquela ocorrência, como:

- identificador da ordem;
- usuário;
- dispositivo;
- requisição;
- operação;
- equipamento.

---

## EventTemplate

`EventTemplate` representa uma versão generalizada da mensagem.

Partes que podem variar entre registros são substituídas por:

```text
<*>
```

Exemplo:

```text
Ordem <*> não recebida no dispositivo <*>
```

Dessa forma, mensagens como:

```text
Ordem ORD-101250 não recebida no dispositivo DISP-1250

Ordem ORD-104372 não recebida no dispositivo DISP-4372

Ordem ORD-109820 não recebida no dispositivo DISP-9820
```

podem representar o mesmo padrão de problema.

---

## EventId

O `EventId` identifica um determinado padrão de log.

Exemplo:

```text
E52
```

O EventId não representa necessariamente gravidade ou um código de erro da aplicação.

Ele funciona como identificador do padrão encontrado no dataset.

---

## Level

Representa o nível de severidade registrado no log.

Na amostra atualmente utilizada, todos os registros de alerta apresentam:

```text
FATAL
```

Por esse motivo, a classificação de prioridade atual é baseada principalmente na recorrência dos padrões.

---

## Component

Indica o componente relacionado ao registro.

Na amostra utilizada aparecem principalmente:

```text
KERNEL
APP
```

Essa informação permite analisar quais componentes concentram maior quantidade de alertas.

---

# 7. Como a análise funciona

O processamento é realizado principalmente utilizando **Python e Pandas**.

O fluxo pode ser representado como:

```text
CSV
 ↓
Pandas
 ↓
Filtro dos alertas
 ↓
Agrupamento por padrão
 ↓
Contagem das ocorrências
 ↓
Cálculo dos limites estatísticos
 ↓
Classificação de prioridade
 ↓
Flask
 ↓
API
 ↓
JavaScript
 ↓
Dashboard
```

---

# 8. Identificação dos alertas

Primeiramente o sistema separa os registros normais dos registros de alerta.

Conceitualmente:

```text
Label == "-"
→ registro normal

Label != "-"
→ registro de alerta
```

Somente os alertas são utilizados para construir o ranking principal.

---

# 9. Agrupamento dos padrões

Depois do filtro, os alertas são agrupados considerando principalmente:

```text
EventId
Level
EventTemplate
```

Registros pertencentes ao mesmo padrão são reunidos.

O sistema então contabiliza quantas vezes cada padrão ocorreu.

Exemplo:

```text
EventId    Ocorrências

E55             59
E52             30
E29              9
E81              9
E32              8
```

Esse agrupamento transforma dezenas ou centenas de mensagens individuais em poucos padrões que podem ser analisados com maior facilidade.

---

# 10. Classificação de prioridade

O sistema utiliza a distribuição das ocorrências para determinar limites de prioridade.

São utilizados dois quartis:

```text
Q50
Q75
```

Na amostra atual:

```text
Q50 = 3,5

Q75 = 8,25
```

A classificação utilizada é:

```text
Ocorrências <= Q50
→ RISCO BAIXO

Ocorrências > Q50 e <= Q75
→ RISCO MÉDIO

Ocorrências > Q75
→ RISCO ALTO
```

Como as ocorrências são valores inteiros, na amostra atual isso representa aproximadamente:

```text
1 a 3 ocorrências
→ RISCO BAIXO

4 a 8 ocorrências
→ RISCO MÉDIO

9 ou mais ocorrências
→ RISCO ALTO
```

É importante destacar que esses valores não foram definidos manualmente como regras universais.

Eles são calculados com base na distribuição dos próprios dados analisados.

---

# 11. Dashboard

Depois do processamento, os resultados são apresentados em um dashboard web.

O dashboard possui diferentes níveis de análise.

---

# 12. Indicadores principais

Na parte superior da aplicação são apresentados indicadores resumidos.

Entre eles estão:

### Registros de alerta

Quantidade total de registros classificados como alerta.

Exemplo:

```text
143
```

### Padrões distintos

Quantidade de padrões identificados após o agrupamento.

Exemplo:

```text
16
```

### Q50

Limite utilizado para determinar os padrões de risco baixo.

### Q75

Limite utilizado para separar risco médio e risco alto.

### Concentração do principal padrão

Indica qual porcentagem de todos os alertas está concentrada no padrão mais recorrente.

---

# 13. Gráfico de padrões mais recorrentes

O gráfico apresenta os EventIds ordenados pela quantidade de ocorrências.

Exemplo:

```text
E55 → 59
E52 → 30
E29 → 9
E81 → 9
```

Também são apresentados visualmente os limites:

```text
Q50
Q75
```

Isso permite identificar rapidamente quais padrões ultrapassaram os limites definidos para cada prioridade.

---

# 14. Poucos padrões, muitos alertas

Esse gráfico compara duas informações:

```text
quantidade percentual de padrões

versus

quantidade percentual de registros
```

Por exemplo:

```text
RISCO ALTO

4 padrões
25% dos padrões

107 registros
75% dos alertas
```

Isso significa que apenas 25% dos tipos de problema representam aproximadamente 75% de todas as ocorrências.

A informação ajuda a demonstrar a concentração dos problemas.

Em vez de investigar todos os padrões simultaneamente, a equipe pode começar pelos poucos padrões responsáveis pela maior parte dos alertas.

---

# 15. Análise temporal

O gráfico **Alertas por dia** apresenta a quantidade de registros de alerta encontrados em cada data.

Ele ajuda a identificar:

- picos de ocorrência;
- períodos com maior concentração de falhas;
- dias com comportamento fora do padrão;
- possíveis momentos relevantes para investigação.

Um pico muito acima das demais datas pode indicar que algum evento específico aconteceu naquele período.

---

# 16. Análise de Pareto

O sistema também apresenta um gráfico de Pareto.

Ele combina:

```text
quantidade de ocorrências por padrão
```

com:

```text
percentual acumulado dos alertas
```

Na amostra atual, aproximadamente:

```text
5 de 16 padrões
```

já representam cerca de:

```text
80% dos registros de alerta
```

Isso mostra que uma pequena quantidade de padrões concentra grande parte das ocorrências.

Essa informação pode ajudar a equipe de suporte a direcionar a investigação para os problemas mais recorrentes.

---

# 17. Alertas por componente

O sistema também agrupa os registros pela coluna:

```text
Component
```

Na amostra utilizada:

```text
KERNEL → 115 alertas
APP    → 28 alertas
```

Isso representa aproximadamente:

```text
KERNEL → 80,4%

APP → 19,6%
```

Essa análise não significa que o componente necessariamente seja a causa do problema.

Ela indica apenas que determinada quantidade de registros de alerta está associada àquele componente.

---

# 18. Ranking completo

O ranking apresenta detalhadamente cada padrão identificado.

A tabela contém:

```text
EventId

Level

EventTemplate

Occurrences

Priority
```

Exemplo:

```text
E55
FATAL
Erro de sincronização com o SAP para o dispositivo <*>
59
RISCO ALTO
```

A tabela permite ordenar e filtrar os dados.

Também existem filtros para:

```text
Todos

RISCO ALTO

RISCO MÉDIO

RISCO BAIXO
```

Além de uma busca por:

```text
EventId
```

ou pelo conteúdo do padrão.

---

# 19. Dataset demonstrativo

Para aproximar a apresentação do sistema de situações encontradas em aplicações corporativas, foi criada uma versão experimental do dataset.

A estrutura original foi preservada, porém as colunas:

```text
Content
EventTemplate
```

dos registros de alerta receberam mensagens sintéticas.

Entre os padrões utilizados estão:

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

Essas mensagens são fictícias e foram criadas exclusivamente para tornar a demonstração mais próxima de cenários reais de suporte.

As quantidades, EventIds e demais informações estruturais do dataset foram preservadas.

---

# 20. Arquitetura da versão web

A aplicação utiliza uma arquitetura simples dividida entre frontend e backend.

```text
                  BGL / CSV
                     ↓
                  Pandas
                     ↓
                 main.py
                     ↓
                  Flask
                     ↓
              /api/analysis
                     ↓
                   JSON
                     ↓
                 app.js
                     ↓
                 Chart.js
                     ↓
                 Dashboard
```

---

# 21. Backend

O backend é responsável por:

- carregar o dataset;
- filtrar registros;
- agrupar alertas;
- calcular ocorrências;
- calcular Q50 e Q75;
- determinar prioridades;
- gerar informações adicionais;
- disponibilizar os resultados para o frontend.

O processamento dos dados ocorre principalmente utilizando Pandas.

---

# 22. API

O Flask disponibiliza os resultados através de um endpoint.

Exemplo local:

```text
http://127.0.0.1:5000/api/analysis
```

A rota:

```text
/api/analysis
```

retorna os resultados no formato JSON.

O JSON funciona como meio de comunicação entre o backend Python e o frontend JavaScript.

O fluxo é:

```text
JavaScript
   ↓
requisição HTTP
   ↓
Flask
   ↓
processamento
   ↓
JSON
   ↓
JavaScript
```

---

# 23. Frontend

O frontend é responsável por transformar os dados recebidos da API em informações visuais.

O JavaScript realiza uma requisição utilizando:

```text
fetch()
```

e recebe o JSON gerado pelo Flask.

Depois disso, são construídos:

- indicadores;
- gráficos;
- ranking;
- filtros;
- pesquisa;
- elementos interativos do dashboard.

---

# 24. Funcionamento em produção

Na aplicação hospedada na Vercel, o frontend utiliza:

```text
/api/analysis
```

como caminho da API.

Assim, frontend e backend podem se comunicar utilizando o mesmo domínio da aplicação.

Exemplo conceitual:

```text
https://aplicacao.vercel.app
```

e:

```text
https://aplicacao.vercel.app/api/analysis
```

---

# 25. Funcionamento durante desenvolvimento local

Durante testes locais, frontend e backend podem ser executados separadamente.

Backend:

```text
python -m src.server
```

Servidor:

```text
http://127.0.0.1:5000
```

Frontend:

```text
python -m http.server 5500 -d public
```

Servidor:

```text
http://127.0.0.1:5500
```

Nesse cenário, o frontend solicita os dados ao backend pela API.

---

# 26. O que o sistema faz

O Log Analyzer:

- processa logs estruturados;
- identifica registros de alerta;
- agrupa padrões semelhantes;
- contabiliza ocorrências;
- classifica padrões por recorrência;
- apresenta indicadores;
- apresenta ranking de alertas;
- identifica concentração de ocorrências;
- apresenta análise temporal;
- apresenta análise por componente;
- facilita a identificação dos problemas mais recorrentes.

---

# 27. O que o sistema não faz

Atualmente o sistema não tem como objetivo:

- corrigir erros automaticamente;
- diagnosticar automaticamente a causa raiz;
- modificar a aplicação analisada;
- executar ações sobre sistemas externos;
- monitorar logs em tempo real;
- substituir a análise humana;
- garantir que um alerta recorrente seja necessariamente a causa principal de um incidente.

O sistema deve ser interpretado como uma ferramenta de **apoio à investigação**.

---

# 28. Exemplo de utilização

Imagine que uma aplicação tenha gerado 143 registros de alerta.

O Log Analyzer identifica que esses registros correspondem a apenas 16 padrões distintos.

Depois da análise, descobre que:

```text
4 padrões
```

são responsáveis por:

```text
107 dos 143 alertas
```

ou aproximadamente:

```text
75%
```

Nesse cenário, a equipe de suporte pode começar sua investigação pelos quatro padrões mais recorrentes.

Isso reduz o volume de informação que precisa ser analisado inicialmente.

---

# 29. Benefícios

A aplicação pode ajudar a:

- reduzir o tempo gasto na leitura manual de logs;
- destacar padrões recorrentes;
- organizar grandes volumes de registros;
- priorizar investigações;
- apresentar evidências de maneira visual;
- facilitar a comunicação entre suporte e desenvolvimento;
- fornecer informações mais claras sobre a ocorrência de incidentes.

---

# 30. Evoluções futuras

Entre possíveis evoluções estão:

- processamento do BGL completo;
- suporte a novos formatos de logs;
- parser automático de logs brutos;
- geração automática de EventTemplate;
- utilização do algoritmo Drain;
- armazenamento das análises em banco de dados;
- integração com SQL;
- combinação entre recorrência e severidade;
- filtros por período;
- filtros por equipamento ou node;
- análise estatística mais avançada;
- identificação de anomalias;
- aplicação de técnicas de machine learning;
- análise assistida por inteligência artificial;
- geração de relatórios;
- integração com ferramentas reais de suporte;
- monitoramento de logs em tempo real.

---

# 31. Conclusão

O Log Analyzer transforma registros de logs em informações estruturadas e visuais.

Sua principal proposta não é substituir profissionais responsáveis pela investigação de incidentes, mas ajudá-los a identificar rapidamente:

```text
o que está acontecendo;

quais problemas mais se repetem;

onde os alertas estão concentrados;

quando ocorreram;

e quais padrões merecem atenção primeiro.
```

Dessa forma, o sistema funciona como uma ferramenta de apoio à análise de logs e à tomada de decisão durante a investigação inicial de incidentes.