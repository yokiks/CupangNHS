export async function up(knex) {
    const hasAccountStatus = await knex.schema.hasColumn('users', 'account_status');
    if (!hasAccountStatus) {
        await knex.schema.alterTable('users', (t) => {
            t.enum('account_status', ['pending_approval', 'approved', 'rejected']).notNullable().defaultTo('pending_approval');
            t.string('school_id_proof_original_name', 255).nullable();
            t.string('school_id_proof_stored_name', 255).nullable();
            t.string('school_id_proof_mime', 150).nullable();
            t.integer('school_id_proof_size').nullable();
            t.text('rejection_reason').nullable();
            t.timestamp('approved_at').nullable();
            t.timestamp('rejected_at').nullable();
        });
    }
}

export async function down(knex) {
    const hasAccountStatus = await knex.schema.hasColumn('users', 'account_status');
    if (hasAccountStatus) {
        await knex.schema.alterTable('users', (t) => {
            t.dropColumn('account_status');
            t.dropColumn('school_id_proof_original_name');
            t.dropColumn('school_id_proof_stored_name');
            t.dropColumn('school_id_proof_mime');
            t.dropColumn('school_id_proof_size');
            t.dropColumn('rejection_reason');
            t.dropColumn('approved_at');
            t.dropColumn('rejected_at');
        });
    }
}
