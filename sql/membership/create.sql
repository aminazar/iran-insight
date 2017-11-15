create table if not exists membership(
    mid serial not null primary key,
    assoc_id integer references association(aid),
    is_active boolean default false not null,
    is_representative boolean default false not null,
    start_time timestamp with time zone not null default current_timestamp,
    end_time timestamp with time zone,
    position_id integer references position_type(id),
    CONSTRAINT mem_start_and_end_dates_in_sequence
    CHECK (start_time < end_time),
    CONSTRAINT mem_duplicate_records
    UNIQUE (assoc_id, position_id, start_time),
    CONSTRAINT associd_position_is_unique
        UNIQUE (assoc_id, position_id)
);
