/* filepath: c:\Users\Victor Almeida\alisson\src\config\configService.ts */
import path from "path";
import fs from "fs/promises";

export type AppConfig = {
  supportPhone?: string;
  supportEmail?: string;
  commercialPhone?: string;
  [k: string]: any;
};

const cfgPath = path.resolve(__dirname, "config.json");
const defaultConfig: AppConfig = {
  supportPhone: "+55 83 9114-4456",
  commercialPhone: "+55 83 9114-4456",
  supportEmail: ""
};

async function ensureConfig(): Promise<AppConfig> {
  try { await fs.access(cfgPath); } catch { await fs.writeFile(cfgPath, JSON.stringify(defaultConfig, null, 2), "utf8"); }
  const raw = await fs.readFile(cfgPath, "utf8");
  try { return JSON.parse(raw); } catch { await fs.writeFile(cfgPath, JSON.stringify(defaultConfig, null, 2), "utf8"); return { ...defaultConfig }; }
}

export async function getConfig(): Promise<AppConfig> { return await ensureConfig(); }

export async function updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
  const current = await ensureConfig();
  const updated = { ...current, ...partial };
  await fs.writeFile(cfgPath, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}
