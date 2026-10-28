CREATE TABLE clientes (
 id TEXT PRIMARY KEY, nome TEXT NOT NULL CHECK(length(trim(nome)) > 0), telefone TEXT, observacoes TEXT,
 criado_em TEXT NOT NULL, atualizado_em TEXT NOT NULL
);
CREATE INDEX idx_clientes_nome ON clientes(nome COLLATE NOCASE);
CREATE TABLE contratos (
 id TEXT PRIMARY KEY, cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
 modalidade TEXT NOT NULL CHECK(modalidade IN ('PARCELA_FIXA','SO_JUROS')),
 principal_centavos INTEGER NOT NULL CHECK(principal_centavos > 0), taxa TEXT NOT NULL,
 prazo INTEGER NOT NULL CHECK(prazo BETWEEN 1 AND 600), mes_quitacao INTEGER NOT NULL,
 primeiro_vencimento TEXT NOT NULL, multa TEXT NOT NULL, mora TEXT NOT NULL,
 criado_em TEXT NOT NULL, atualizado_em TEXT NOT NULL, versao INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_contratos_cliente ON contratos(cliente_id);
CREATE TABLE parcelas (
 id TEXT PRIMARY KEY, contrato_id TEXT NOT NULL REFERENCES contratos(id) ON DELETE RESTRICT,
 numero INTEGER NOT NULL, vencimento TEXT NOT NULL,
 principal_centavos INTEGER NOT NULL CHECK(principal_centavos >= 0), juros_centavos INTEGER NOT NULL CHECK(juros_centavos >= 0),
 cancelada INTEGER NOT NULL DEFAULT 0, UNIQUE(contrato_id,numero)
);
CREATE INDEX idx_parcelas_vencimento ON parcelas(vencimento);
CREATE TABLE antecipacoes (
 id TEXT PRIMARY KEY, contrato_id TEXT NOT NULL REFERENCES contratos(id), tipo TEXT NOT NULL,
 valor_centavos INTEGER NOT NULL DEFAULT 0, novo_mes INTEGER, data_efetiva TEXT NOT NULL, criado_em TEXT NOT NULL
);
CREATE TABLE pagamentos (
 id TEXT PRIMARY KEY, parcela_id TEXT NOT NULL REFERENCES parcelas(id), antecipacao_id TEXT REFERENCES antecipacoes(id),
 valor_centavos INTEGER NOT NULL CHECK(valor_centavos > 0), principal_centavos INTEGER NOT NULL,
 juros_centavos INTEGER NOT NULL, multa_centavos INTEGER NOT NULL, mora_centavos INTEGER NOT NULL,
 data_efetiva TEXT NOT NULL, forma TEXT, observacao TEXT, criado_em TEXT NOT NULL,
 estornado_em TEXT, justificativa TEXT, chave TEXT NOT NULL UNIQUE,
 CHECK(valor_centavos = principal_centavos + juros_centavos + multa_centavos + mora_centavos)
);
CREATE INDEX idx_pagamentos_parcela_data ON pagamentos(parcela_id,data_efetiva);
CREATE TABLE historico_operacoes (
 id TEXT PRIMARY KEY, recurso_id TEXT NOT NULL, operacao TEXT NOT NULL, detalhes TEXT NOT NULL, criado_em TEXT NOT NULL
);
