export async function up(knex) {
    await knex.raw("ALTER TABLE concerns MODIFY status ENUM('pending','read','in_review','resolved','deleted') NOT NULL DEFAULT 'pending'");
}

export async function down(knex) {
    await knex.raw("ALTER TABLE concerns MODIFY status ENUM('pending','read','in_review','resolved') NOT NULL DEFAULT 'pending'");
}
