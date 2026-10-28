import { test, expect } from "@playwright/test";
test("cliente, contrato, pagamento parcial, estorno, antecipação e exportação", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Nenhum cliente cadastrado.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Novo cliente", exact: true }).click();
  await page
    .getByLabel("Nome", { exact: true })
    .fill("Cliente de teste isolado");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await expect(page).toHaveURL(/#\/simulador\?cliente=/);
  await expect(
    page.getByRole("heading", { name: "Simular crédito" }),
  ).toBeVisible();
  await page.getByLabel("Valor do empréstimo").fill("1000");
  await page.getByLabel("Taxa mensal").fill("3");
  await page.getByLabel("Número de parcelas").fill("2");
  await page.getByRole("button", { name: "Calcular simulação" }).click();
  await expect(
    page.getByRole("heading", { name: "Resultado da simulação" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Cliente responsável").locator("option:checked"),
  ).toHaveText("Cliente de teste isolado");
  await page
    .getByRole("button", { name: "Confirmar contrato", exact: true })
    .click();
  await page.getByRole("button", { name: "Criar contrato e parcelas" }).click();
  await expect(
    page.getByRole("heading", { name: "Cronograma de vencimentos" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Receber", exact: true })
    .first()
    .click();
  await page.getByLabel("Valor recebido").fill("30");
  await page.getByRole("button", { name: "Registrar recebimento" }).click();
  await expect(
    page.getByText("Parcialmente pago", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Estornar", exact: true }).click();
  await page
    .getByLabel("Justificativa")
    .fill("Correção para teste de reversão");
  await page.getByRole("button", { name: "Confirmar estorno" }).click();
  await expect(page.getByText("Estornado", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Antecipação", exact: true }).click();
  await page.getByLabel("Valor recebido").fill("600");
  await page.getByRole("button", { name: "Calcular prévia" }).click();
  await expect(page.getByText("Parcela 2:", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar antecipação" }).click();
  await expect(page.getByText("Antecipado", { exact: true })).toBeVisible();
  const pdfPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF", exact: true }).click();
  const pdf = await pdfPromise;
  expect(pdf.suggestedFilename()).toMatch(/extrato.*\.pdf/);
  await pdf.saveAs("../.dev/e2e-extrato.pdf");
  await page.screenshot({ path: "../.dev/e2e-contrato.png", fullPage: true });
  await page.getByRole('navigation',{name:'Menu principal'}).getByRole("link", { name: "Contratos", exact: true }).click();
  const linha = page
    .locator(".contract-row")
    .filter({ hasText: "Cliente de teste isolado" });
  await expect(linha).toHaveCount(1);
  const codigo = (await linha.getAttribute("href"))!.split("/").pop()!;
  await page.getByRole("searchbox", { name: "Pesquisar contratos", exact: true }).fill("TESTE ISOLADO fixa");
  await expect(linha).toBeVisible();
  await linha.hover();
  await expect(linha).toHaveCSS("background-color", "rgb(242, 245, 252)");
  await page.getByRole("searchbox", { name: "Pesquisar contratos", exact: true }).fill(codigo.slice(0, 8));
  await expect(linha).toBeVisible();
  await page.getByRole("searchbox", { name: "Pesquisar contratos", exact: true }).fill("contrato inexistente");
  await expect(
    page.getByText("Nenhum contrato encontrado para esta pesquisa."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Limpar pesquisar contratos" })
    .click();
  await expect(linha).toBeVisible();
  await page.screenshot({ path: "../.dev/e2e-carteira.png", fullPage: true });
  await page.getByRole("link", { name: "Dados e segurança" }).click();
  const backupPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar backup" }).click();
  const backup = await backupPromise;
  await backup.saveAs("../.dev/e2e-backup.db");
  await expect(page.getByRole("status")).toContainText(
    "Backup exportado com sucesso. Download iniciado:",
  );
  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await page.getByRole("button", { name: "Novo cliente", exact: true }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Cliente após backup");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await expect(page).toHaveURL(/#\/simulador\?cliente=/);
  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Cliente após backup" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Dados e segurança" }).click();
  await page
    .getByLabel("Selecionar backup")
    .setInputFiles("../.dev/e2e-backup.db");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Restaurar banco", exact: true })
    .click();
  await expect(
    page.getByText("Backup restaurado.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Cliente após backup" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("link", { name: "Cliente de teste isolado", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cliente após backup", exact: true })).toHaveCount(0);
});
test("só juros preserva pagamentos e elimina juros futuros", async ({
  page,
}) => {
  await page.goto("/#/simulador");
  await page.getByRole("button", { name: "Só juros", exact: true }).click();
  await page.getByLabel("Valor do empréstimo").fill("1000");
  await page.getByLabel("Taxa mensal").fill("3");
  await page.getByLabel("Horizonte").fill("6");
  await page.getByLabel("Mês de quitação", { exact: true }).fill("6");
  await page.getByRole("button", { name: "Calcular simulação" }).click();
  await expect(
    page.getByRole("heading", { name: "Resultado da simulação" }),
  ).toBeVisible();
  await page
    .getByLabel("Cliente responsável")
    .selectOption({ label: "Cliente de teste isolado" });
  await page
    .getByRole("button", { name: "Confirmar contrato", exact: true })
    .click();
  await page.getByRole("button", { name: "Criar contrato e parcelas" }).click();
  await page
    .getByRole("button", { name: "Receber", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Registrar recebimento" }).click();
  await expect(page.getByText("Pago", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Antecipação", exact: true }).click();
  await page.getByLabel("Novo mês de quitação").fill("3");
  await page.getByRole("button", { name: "Calcular prévia" }).click();
  await expect(
    page.getByText("Juros eliminados:", { exact: false }),
  ).toContainText("90,00");
  await page.getByRole("button", { name: "Confirmar antecipação" }).click();
  await expect(page.getByText("Cancelado", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Pago", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Extrato emitido em", { exact: false }),
  ).not.toContainText("Invalid Date");
});
