# Cache das listas

O frontend guarda em localStorage do perfil do WebView uma cópia das listas de clientes e dos resumos de contratos consultados. Não guarda token, mutações pendentes, extratos individuais nem histórico de pagamentos/parcelas. Buscas textuais de clientes não geram novas cópias persistentes. O SQLite continua como fonte dos dados.

Na abertura, o QueryClient hidrata essas listas antes da primeira renderização e consulta o backend em segundo plano, mesmo quando o cache existe. Ao reabrir o aplicativo, os detalhes de um contrato exigem consulta ao banco antes de apresentar as ações financeiras. O cache agiliza a exibição; não reduz o tempo de inicialização do Java.

A validade máxima é de 24 horas por consulta. Alterações de versão descartam cópias da versão anterior. JSON inválido, estrutura incompatível, validade vencida e falhas de armazenamento são tratados sem impedir a abertura. A gravação é agrupada em intervalos de 150 ms e também ocorre quando a janela é ocultada ou o documento fecha; dados de uma gravação anterior continuam disponíveis em caso de encerramento abrupto.

Antes de mutações, o cache em disco é descartado e as consultas de listas em andamento são canceladas. As listas são invalidadas e consultadas novamente ao concluir a operação, incluindo restauração. Não há persistência enquanto existe uma mutação em andamento, nem de consultas invalidadas. Assim, clientes ou contratos removidos pela restauração não são reintroduzidos pelo cache.

Os testes de navegador no GitHub Actions cobrem reabertura com backend aguardando, atualização posterior pelo servidor, cache inválido/expirado e restauração seguida de reabertura. A exportação tem testes de download, aviso, andamento e falha.
