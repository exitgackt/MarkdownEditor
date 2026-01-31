"""add email auth fields

Revision ID: add_email_auth_001
Revises: c462657a8155
Create Date: 2026-01-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_email_auth_001'
down_revision = 'c462657a8155'
branch_labels = None
depends_on = None


def upgrade():
    # Use batch operations for SQLite compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Make google_id nullable
        batch_op.alter_column('google_id',
                              existing_type=sa.String(),
                              nullable=True)

        # Add new authentication fields
        batch_op.add_column(sa.Column('hashed_password', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('auth_provider', sa.String(), nullable=False, server_default='email'))
        batch_op.add_column(sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('email_verification_token', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('password_reset_token', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True))

    # Migrate existing Google users
    op.execute("""
        UPDATE users
        SET auth_provider = 'google',
            email_verified = 1
        WHERE google_id IS NOT NULL
    """)


def downgrade():
    # Use batch operations for SQLite compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Remove new columns
        batch_op.drop_column('password_reset_expires')
        batch_op.drop_column('password_reset_token')
        batch_op.drop_column('email_verification_token')
        batch_op.drop_column('email_verified')
        batch_op.drop_column('auth_provider')
        batch_op.drop_column('hashed_password')

        # Make google_id not nullable again
        batch_op.alter_column('google_id',
                              existing_type=sa.String(),
                              nullable=False)
