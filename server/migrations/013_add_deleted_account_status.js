export async function up(knex) {
    await knex.raw("ALTER TABLE users MODIFY account_status ENUM('active','pending_approval','pending_revalidation','inactive','graduated','transferred','deleted') NOT NULL DEFAULT 'pending_approval'");
}

export async function down(knex) {
    await knex.raw("ALTER TABLE users MODIFY account_status ENUM('active','pending_approval','pending_revalidation','inactive','graduated','transferred') NOT NULL DEFAULT 'pending_approval'");
}
