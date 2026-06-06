package com.munichweekly.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.logging.Logger;

/**
 * Keeps gallery item schema compatible with Hibernate ddl-auto updates.
 * The project currently does not run Flyway migrations, and Hibernate cannot
 * safely add a non-null column or drop NOT NULL on existing rows.
 */
@Component
public class GalleryOrderSchemaMigration {

    private static final Logger logger = Logger.getLogger(GalleryOrderSchemaMigration.class.getName());

    private final JdbcTemplate jdbcTemplate;

    public GalleryOrderSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void migrateGallerySubmissionOrderSchema() {
        if (!tableExists("gallery_submission_order")) {
            return;
        }

        logger.info("Ensuring gallery_submission_order supports custom gallery images");

        jdbcTemplate.execute("""
                ALTER TABLE gallery_submission_order
                ADD COLUMN IF NOT EXISTS item_type VARCHAR(30) DEFAULT 'SUBMISSION'
                """);
        jdbcTemplate.execute("""
                UPDATE gallery_submission_order
                SET item_type = 'SUBMISSION'
                WHERE item_type IS NULL
                """);
        jdbcTemplate.execute("""
                ALTER TABLE gallery_submission_order
                ALTER COLUMN submission_id DROP NOT NULL
                """);
        jdbcTemplate.execute("""
                ALTER TABLE gallery_submission_order
                ADD COLUMN IF NOT EXISTS custom_image_url VARCHAR(500)
                """);
        jdbcTemplate.execute("""
                ALTER TABLE gallery_submission_order
                ADD COLUMN IF NOT EXISTS custom_title VARCHAR(200)
                """);
        jdbcTemplate.execute("""
                ALTER TABLE gallery_submission_order
                ADD COLUMN IF NOT EXISTS custom_description TEXT
                """);
        jdbcTemplate.execute("""
                ALTER TABLE gallery_submission_order
                ADD COLUMN IF NOT EXISTS custom_image_width INTEGER
                """);
        jdbcTemplate.execute("""
                ALTER TABLE gallery_submission_order
                ADD COLUMN IF NOT EXISTS custom_image_height INTEGER
                """);
        jdbcTemplate.execute("""
                ALTER TABLE gallery_submission_order
                ADD COLUMN IF NOT EXISTS custom_aspect_ratio DECIMAL(10, 6)
                """);

        logger.info("gallery_submission_order schema is ready for custom gallery images");
    }

    private boolean tableExists(String tableName) {
        Boolean exists = jdbcTemplate.queryForObject(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = ?
                )
                """,
                Boolean.class,
                tableName
        );
        return Boolean.TRUE.equals(exists);
    }
}
