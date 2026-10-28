import { invoke, isTauri } from "@tauri-apps/api/core";
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (isTauri())
    return invoke<T>("api_request", {
      path,
      method,
      body: body === undefined ? null : JSON.stringify(body),
    }).catch((error: unknown) => {
      throw new Error(error instanceof Error ? error.message : String(error));
    });
  const res = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({
      detail: "Backend indisponível. Verifique a inicialização.",
    }));
    throw new Error(error.detail || "Não foi possível concluir a operação.");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}
export async function baixar(path: string, nome: string) {
  let bytes: Uint8Array;
  if (isTauri()) {
    const data = await invoke<number[]>("api_download", { path });
    bytes = new Uint8Array(data);
  } else {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Não foi possível exportar.");
    bytes = new Uint8Array(await res.arrayBuffer());
  }
  const url = URL.createObjectURL(new Blob([bytes]));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
