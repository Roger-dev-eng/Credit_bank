# Arquitetura

`frontend/` contém a apresentação. Valores financeiros são recebidos da API; o frontend só formata moeda e datas. `backend/` é a fonte de cálculos e persistência. `desktop/` contém o host Tauri, a ponte IPC e o ciclo de vida do Java auxiliar.

## Camadas

Controllers validam DTOs de entrada com Bean Validation. `Calculadora` mantém fórmulas e cronogramas. `ClienteService` utiliza Spring Data JPA/Hibernate; `ContratoService` mantém regras transacionais e replay das alocações. `FinanceiroRepository` encapsula acesso SQL aos registros financeiros.

Decisão técnica: operações de ledger usam JdbcTemplate participando da mesma transação Spring/JPA. Isso permite gravar explicitamente centavos inteiros no SQLite e inserir pagamento, alocações, antecipação e histórico de forma atômica. Não há segundo banco nem substituição de Spring Data JPA/Hibernate. O cadastro usa a entidade `Cliente`; registros financeiros possuem esquema relacional definido por Flyway e DTOs de saída. O modelo financeiro não usa entidades JPA mutáveis nem geração automática de esquema.

## SQLite

Banco novo, sem seeds: clientes, contratos, parcelas, pagamentos, antecipacoes, historico_operacoes e histórico Flyway. IDs são UUIDs. Foreign keys são habilitadas na conexão JDBC; exclusões vinculadas são restritas. Há índices por cliente, vencimento e pagamento/parcela/data. Valores monetários são INTEGER em centavos, taxas são texto decimal. Não há operações financeiras em ponto flutuante no backend.

O pool tem uma conexão. A API serializa requisições locais para evitar promoções concorrentes de leitura para escrita e coordenar restauração. Transações Spring protegem cada mutação financeira. A chave única de pagamento impede contabilização duplicada; um retry duplicado retorna conflito, sem segundo lançamento.

Saldo e indicadores são projeções dos registros. Alocações de principal, juros, multa e mora são persistidas em cada recebimento. Encargos pendentes são reconstituídos com datas efetivas e intervalos entre pagamentos. Leituras não alteram registros. Quitação é derivada de saldo zero; um status visual não tem endpoint de alteração.

## Segurança e desktop

O Java escuta apenas 127.0.0.1. O Tauri escolhe uma porta local livre e gera um token aleatório por execução, mantido no Rust e transmitido ao Java pelo ambiente. React utiliza comandos IPC; o token não aparece no bundle JavaScript, URL ou armazenamento web. A API exige token inclusive para documentação, rejeita Origin e não configura CORS aberto. A ponte limita caminhos a `/api/`, recusa métodos desconhecidos e não segue redirects HTTP.

O processo auxiliar é o `java.exe` do runtime jlink, com `backend.jar` como recurso. O Rust cria um Job Object Windows com KILL_ON_JOB_CLOSE e associa o Java: o sistema operacional encerra o filho mesmo se o host cair. O fechamento normal mata e aguarda o filho. Falhas de prontidão são informadas na interface; logs de inicialização ficam em `backend.log`, no diretório de dados. O token protege contra páginas e processos que não o conheçam; não constitui isolamento contra um processo malicioso com os mesmos privilégios capaz de ler memória/ambiente do usuário.

O runtime e JAR são recursos empacotados, não arquivos de dados. O banco desktop fica no diretório retornado por `app_local_data_dir`, tipicamente `%LOCALAPPDATA%/app.credito.desktop/credito.db`. Execução Java independente usa `%USERPROFILE%/AppData/Local/GestaoCredito`. `CREDITO_DATA_DIR` permite diretório explícito.

## Backups

Exportação usa SQLite Online Backup API, evitando cópias inconsistentes de arquivo aberto. Restauração recebe um SQLite, valida integridade, chaves estrangeiras, tabelas e checksums Flyway antes de alterar o banco ativo. Antes da restauração é criado um backup em `backups/antes-restauracao-*.db`. A operação é serializada com as demais requisições. Nunca usar restauração com uma transação de negócio aberta.

## API

- GET/POST `/api/clientes`; GET/PUT/DELETE `/api/clientes/{id}`.
- POST `/api/simulacoes` com modalidade `PARCELA_FIXA` ou `SO_JUROS`, principal, taxa percentual, prazo ou parcelaDesejada, mesQuitacao opcional, primeiroVencimento, multa e mora.
- GET/POST `/api/contratos`; filtro `clienteId` para consulta.
- GET `/api/contratos/{id}`, `/extrato`, `/parcelas`, `/historico`, `/pdf`.
- POST `/api/pagamentos`; POST `/api/pagamentos/{id}/estorno`.
- POST `/api/antecipacoes/previa`; POST `/api/antecipacoes`.
- GET `/api/backups`; POST `/api/backups/restaurar` com conteúdo em byte array/base64 JSON.
- GET `/api/health`, `/v3/api-docs`, `/swagger-ui/index.html` (documentação também exige X-Credito-Token).

Falhas de validação: 400; inexistência: 404; regra financeira: 422; conflito de persistência: 409; ausência de credencial/origem web: 403. Respostas de erro usam ProblemDetail. O frontend não repete automaticamente mutações.

## Compatibilidade verificada

Spring Boot 3.5.7 gerencia Hibernate core 6.6 e a mesma versão de hibernate-community-dialects. SQLite JDBC 3.50.3.0 e Flyway core gerenciado pelo Boot foram exercitados criando e restaurando SQLite real nos testes. Documentação de referência: [Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/system-requirements.html), [Hibernate 6.6](https://hibernate.org/orm/releases/6.6/), [Flyway SQLite](https://documentation.red-gate.com/flyway/reference/database-driver-reference/sqlite), [Tauri 2](https://v2.tauri.app/).
