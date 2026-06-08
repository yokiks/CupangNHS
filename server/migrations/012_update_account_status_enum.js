export async function up(knex) {
    await knex.schema.alterTable('users', (t) => {
        t.enu('account_status', ['active', 'pending_approval', 'pending_revalidation', 'inactive', 'graduated', 'transferred'])
            .notNullable()
            .defaultTo('pending_approval')
            .alter();
    });

    await knex('users')
        .where('account_status', 'approved')
        .update({ account_status: 'active' });

    await knex('users')
        .where('account_status', 'rejected')
        .update({ account_status: 'pending_revalidation' });
}

export async function down(knex) {
    await knex('users')
        .where('account_status', 'active')
        .update({ account_status: 'approved' });

    await knex('users')
        .where('account_status', 'pending_revalidation')
        .update({ account_status: 'rejected' });

    await knex('users')
        .whereIn('account_status', ['inactive', 'graduated', 'transferred'])
        .update({ account_status: 'pending_approval' });

    await knex.schema.alterTable('users', (t) => {
        t.enu('account_status', ['pending_approval', 'approved', 'rejected'])
            .notNullable()
            .defaultTo('pending_approval')
            .alter();
    });
}
