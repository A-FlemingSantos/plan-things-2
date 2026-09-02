package db.migration;

import com.planthings.api.plans.PlanSlugService;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V32__BackfillPlanSlugsFromName extends BaseJavaMigration {

  @Override
  public void migrate(Context context) throws Exception {
    PlanSlugService.rewriteLegacyCompactSlugs(context.getConnection());
  }
}
