/* filepath: c:\Users\Victor Almeida\alisson\src\routes\configRouter.ts */
import express from "express";
import { getConfig, updateConfig } from "../config/configService";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const cfg = await getConfig();
    res.json({ ok: true, config: cfg });
  } catch (err) {
    console.error("config:get error", err);
    res.status(500).json({ ok: false, error: "Erro ao ler configuração" });
  }
});

router.put("/", express.json(), async (req, res) => {
  try {
    const partial = req.body || {};
    const updated = await updateConfig(partial);
    res.json({ ok: true, config: updated });
  } catch (err) {
    console.error("config:update error", err);
    res.status(500).json({ ok: false, error: "Erro ao atualizar configuração" });
  }
});

export default router;
