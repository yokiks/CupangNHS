export async function up(knex) {
    const hasColumn = await knex.schema.hasColumn("users", "revalidation_submission_unlocked");
    if (!hasColumn) {
        await knex.schema.alterTable("users", (t) => {
            t.boolean("revalidation_submission_unlocked").notNullable().defaultTo(false);
        });
    }
}

export async function down(knex) {
    const hasColumn = await knex.schema.hasColumn("users", "revalidation_submission_unlocked");
    if (hasColumn) {
        await knex.schema.alterTable("users", (t) => {
            t.dropColumn("revalidation_submission_unlocked");
        });
    }
}
