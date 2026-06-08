export async function up(knex) {
    await knex.raw(
        "ALTER TABLE concern_status_history MODIFY old_status ENUM('pending','read','in_review','resolved','deleted') NULL"
    );
    await knex.raw(
        "ALTER TABLE concern_status_history MODIFY new_status ENUM('pending','read','in_review','resolved','deleted') NOT NULL"
    );
}

export async function down(knex) {
    await knex.raw(
        "ALTER TABLE concern_status_history MODIFY old_status ENUM('pending','read','in_review','resolved') NULL"
    );
    await knex.raw(
        "ALTER TABLE concern_status_history MODIFY new_status ENUM('pending','read','in_review','resolved') NOT NULL"
    );
}
