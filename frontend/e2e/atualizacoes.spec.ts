import { test, expect, type Page } from "@playwright/test";

async function nativeMock(
  page: Page,
  mode: "available" | "latest" | "offline",
) {
  await page.addInitScript(
    ({ mode }) => {
      const w = window as any;
      let next = 0;
      const callbacks: Record<number, (event: unknown) => void> = {};
      let handler = 0;
      w.isTauri = true;
      w.updateInstallCalls = 0;
      w.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => {} };
      w.__TAURI_INTERNALS__ = {
        transformCallback: (callback: (event: unknown) => void) => {
          callbacks[++next] = callback;
          return next;
        },
        unregisterCallback: (id: number) => {
          delete callbacks[id];
        },
        invoke: async (command: string, args: any) => {
          if (command === "plugin:event|listen") {
            handler = args.handler;
            return handler;
          }
          if (command === "plugin:event|unlisten") return;
          if (command === "api_request") return [];
          if (command === "check_update") {
            if (mode === "offline")
              throw "Não foi possível consultar as atualizações. Verifique sua internet.";
            return {
              available: mode === "available",
              currentVersion: "0.3.0",
              version: "0.4.0",
              notes: "Melhorias de teste",
            };
          }
          if (command === "install_update") {
            w.updateInstallCalls++;
            callbacks[handler]?.({
              event: "update-progress",
              id: handler,
              payload: { stage: "backup" },
            });
            await new Promise((r) => setTimeout(r, 800));
            throw "Assinatura inválida. Nenhuma atualização foi instalada.";
          }
        },
      };
    },
    { mode },
  );
  await page.goto("/#/atualizacoes");
}
test("atualização exige confirmação e informa falha sem declarar sucesso", async ({
  page,
}) => {
  await nativeMock(page, "available");
  await page.getByRole("button", { name: "Verificar atualizações" }).click();
  await expect(page.getByText("Nova versão 0.4.0 disponível.")).toBeVisible();
  await page.getByRole("button", { name: "Atualizar agora" }).click();
  await expect(
    page.getByText("Seu banco de dados será preservado.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Agora não" }).click();
  expect(await page.evaluate(() => (window as any).updateInstallCalls)).toBe(0);
  await page.getByRole("button", { name: "Atualizar agora" }).click();
  await page.getByRole("button", { name: "Baixar e instalar" }).click();
  await expect(
    page.getByRole("heading", { name: "Protegendo seus dados" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Assinatura inválida");
  await expect(
    page.getByRole("dialog", { name: "Atualizando sistema" }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).updateInstallCalls)).toBe(1);
});
test("sem atualização e falha de internet são estados diferentes", async ({
  page,
}) => {
  await nativeMock(page, "latest");
  await page.getByRole("button", { name: "Verificar atualizações" }).click();
  await expect(
    page.getByText("Você está usando a versão mais recente disponível."),
  ).toBeVisible();
});
test("falha de consulta não indica que a versão está atualizada", async ({
  page,
}) => {
  await nativeMock(page, "offline");
  await page.getByRole("button", { name: "Verificar atualizações" }).click();
  await expect(page.getByRole("alert")).toContainText("Verifique sua internet");
  await expect(
    page.getByText("Você está usando a versão mais recente disponível."),
  ).toHaveCount(0);
});
