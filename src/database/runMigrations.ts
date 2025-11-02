import knex from "knex";
import config from './knexfile';

(async () => {
  const db = knex(config.development);

  console.log("🔍 Verificando migrations pendentes...");
  try {
    const [batchNo, log] = await db.migrate.latest();
    if (log.length === 0) {
      console.log("✅ Nenhuma migration pendente.");
    } else {
      console.log(`✅ Migrations executadas (batch ${batchNo}):`);
      console.log(log.join(", "));
    }
  } catch (error) {
    console.error("❌ Erro ao rodar migrations:", error);
  } finally {
    await db.destroy();
  }
})();
