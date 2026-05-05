ALTER TABLE sessions
	ALTER COLUMN expires_at TYPE TIMESTAMPTZ
	USING CASE
		WHEN expires_at > 1000000000000 THEN to_timestamp(expires_at / 1000.0)
		ELSE to_timestamp(expires_at)
	END;
