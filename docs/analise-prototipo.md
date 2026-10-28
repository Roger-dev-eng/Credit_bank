# Análise do protótipo e decisões

O HTML fornecido concentra apresentação, estado, cálculos, persistência e impressão em uma função JavaScript. A interface contém cadastro/seleção/renomeação/exclusão de clientes; duas abas financeiras; calculadora bidirecional; multa e mora; edição visual de status; antecipações; cartões; linha do tempo; tabelas e extrato para impressão.

## Regras identificadas

- Parcela fixa: principal dividido pelo prazo mais juros mensais sobre o principal original. O prazo inverso é o teto de principal / (parcela desejada - juros mensais).
- Só juros: juros mensais sobre o principal original e principal integral no mês planejado de quitação, dentro do horizonte.
- Multa percentual e mora simples por dia, após o vencimento.
- Antecipação fixa percorre o cronograma de trás para frente. A antecipação de só juros muda o mês do principal e elimina meses posteriores.
- Datas, valores e textos em português brasileiro; azul escuro, cartões brancos, indicadores e cores de status.

## Problemas corrigidos

1. `localStorage` armazenava a carteira sem transações, restrições ou trilha financeira; nenhuma informação foi importada.
2. O estado guardava só uma operação de cada modalidade por cliente. Agora cada confirmação cria um contrato independente.
3. Simular sobrescrevia operações do cliente. A simulação agora é uma consulta sem persistência.
4. Alterar um seletor de status criava um recebimento implícito. Agora status deriva de pagamentos e saldos.
5. `render` alterava atrasos e persistia dados. Consultas calculam encargos sem gravar.
6. Antecipações fixas eliminavam parcelas, inclusive pagas, sem contabilizar dinheiro; removê-las podia ressuscitar saldos. Agora há registros de recebimento e estornos com justificativa.
7. Indicadores excluíam antecipações e por vezes o principal quitado; recebimentos agora vêm dos lançamentos ativos.
8. `Number` e arredondamento por parcela podiam criar ou perder centavos. Java usa BigDecimal; SQLite guarda centavos inteiros.
9. Recriar o cronograma de só juros podia perder pagamentos e encargos. Alterações são bloqueadas se houver pagamentos nos meses afetados.
10. Dados de clientes interpolados em `innerHTML` podiam criar HTML executável. React apresenta strings escapadas.
11. Dependência de fontes remotas foi removida; a aplicação utiliza fontes do sistema.
12. Não há marca comercial, cadastro fictício automático nem migração do protótipo.

## Regras aprovadas pelo usuário nesta conversa

Antecipação fixa é dinheiro recebido, sem desconto de juros, aplicado às últimas parcelas elegíveis. Pagamento parcial cobre multa, mora, juros e principal, nessa ordem. A mora futura incide apenas no saldo de principal e juros.

### Convenções explícitas

- Arredondamento monetário HALF_UP a duas casas. Juros mensais são arredondados antes da multiplicação pelo prazo.
- Amortização fixa regular é truncada em centavos; o último mês recebe o resíduo para preservar exatamente o principal. O resultado exibe a primeira parcela e cada valor do cronograma.
- Vencimentos são `primeiroVencimento.plusMonths(k)` ancorados na data original; 31/01/2024 produz 29/02 e 31/03.
- Calendário de operação: America/Sao_Paulo; vencimento não inclui hora. Encargos começam no dia seguinte.
- Multa é aplicada uma única vez sobre o saldo de principal + juros no primeiro evento em atraso. Ela não é recalculada sobre um saldo menor após o pagamento parcial.
- Mora simples é acumulada em precisão decimal entre pagamentos, sobre o saldo de principal + juros de cada intervalo, e arredondada ao exibir ou alocar o pagamento. Não há capitalização.
- Pagamentos na mesma data respeitam a ordem de registro. Recebimentos futuros são recusados. Retroativos anteriores a recebimentos existentes na mesma parcela exigem estorno dos posteriores, para manter as alocações históricas.
- Estorno preserva o lançamento e sua justificativa; deve começar pelo pagamento mais recente da parcela. O saldo é reconstituído desconsiderando estornos.
- Antecipação fixa não considera parcelas com pagamentos posteriores à data efetiva escolhida. A prévia é recalculada na confirmação em transação.
- Antecipação de só juros não registra dinheiro; muda o planejamento. Não pode eliminar períodos vencidos, nem afetar parcelas com pagamentos. As parcelas removidas permanecem canceladas, e a alteração fica no histórico. O recebimento do principal exige registro próprio.
- Contratos não são editáveis ou excluíveis nesta versão: isso evita alterar cronogramas financeiros existentes. Clientes podem ser editados; exclusão exige ausência de contratos.

## Sequência técnica executada

1. Análise e aprovação das ambiguidades financeiras.
2. Backend Java 21 / Spring Boot 3.5; migração Flyway; SQLite com integridade referencial; cálculos e ledger transacional.
3. React/TypeScript/Vite, Tailwind, componentes no padrão shadcn/ui, Router, Query, Hook Form e Zod.
4. Pagamentos, encargos, estornos, antecipações, extratos PDF e backup/restauração.
5. Tauri 2, processo Java auxiliar com runtime jlink, token por execução e vínculo de processo Windows.
6. Testes Java, build frontend, teste de navegador e tentativa de distribuição Windows. O resultado efetivo de validação está no README.
