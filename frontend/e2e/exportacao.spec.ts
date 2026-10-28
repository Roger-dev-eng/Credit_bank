import { test, expect } from "@playwright/test";

test("exportação em andamento impede cliques repetidos e falha não informa sucesso", async ({
  page,
}) => {
  let liberar!: () => void;
  const aguardar = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await page.route("**/api/backups", async (route) => {
    await aguardar;
    await route.fulfill({ status: 500, json: { detail: "Falha no backup" } });
  });
  await page.goto("/#/configuracoes");
  await page
    .getByRole("button", { name: "Exportar backup", exact: true })
    .click();
  try {
    await expect(
      page.getByRole("button", { name: "Exportando…", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText("Backup exportado com sucesso.", { exact: false }),
    ).toHaveCount(0);
  } finally {
    liberar();
  }
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível exportar.",
  );
  await expect(
    page.getByRole("button", { name: "Exportar backup", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("Backup exportado com sucesso.", { exact: false }),
  ).toHaveCount(0);
});
