CREATE TABLE IF NOT EXISTS page_edits (
    page_id     VARCHAR(64)  NOT NULL,
    block_id    VARCHAR(128) NOT NULL,
    content     TEXT,
    deleted     BOOLEAN      DEFAULT FALSE,
    updated_at  TIMESTAMP    DEFAULT NOW(),
    updated_by  VARCHAR(100),
    PRIMARY KEY (page_id, block_id)
);
CREATE INDEX IF NOT EXISTS idx_page_edits_page ON page_edits (page_id);
