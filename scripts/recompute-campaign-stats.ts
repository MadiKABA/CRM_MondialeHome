import { recomputeAllCampaignStats } from "@/features/campaigns/lib/stats";
import { db } from "@/lib/db";

recomputeAllCampaignStats()
  .then((r) => {
    console.log(`Campagnes recalculées : ${r.processed} (échecs : ${r.failed})`);
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
