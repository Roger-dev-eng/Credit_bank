import { test, expect } from "@playwright/test";
test("atualizações possuem página própria e não aparecem em dados e segurança", async ({
  page,
}) => {
  await page.goto("/#/configuracoes");
  await expect(
    page.getByRole("heading", { name: "Dados e segurança", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atualizações do sistema" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Atualizações", exact: true }).click();
  await expect(page).toHaveURL(/#\/atualizacoes$/);
  await expect(
    page.getByRole("heading", { name: "Atualizações", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atualizações do sistema" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cópia de segurança" }),
  ).toHaveCount(0);
});
test("editar um cliente mantém a listagem; apenas o cadastro novo abre simulação", async ({
  page,
}) => {
  await page.goto("/#/clientes");
  const row = page
    .locator(".client-row")
    .filter({ hasText: "Cliente de teste isolado" });
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Telefone (opcional)").fill("11999990000");
  await page
    .getByRole("button", { name: "Salvar cliente", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/clientes$/);
  await row.getByRole("link").click();
  await expect(page.locator(".contract-row").first()).toContainText(
    "Cliente de teste isolado",
  );
  await page.locator(".contract-row").first().hover();
  await expect(page.locator(".contract-row").first()).toHaveCSS(
    "background-color",
    "rgb(242, 245, 252)",
  );
});
