create table if not exists membership(
    mid serial not null primary key,
    assoc_id integer not null references association(aid) on delete cascade,
    is_active boolean default false not null,
    is_representative boolean default false not null,
    start_time date not null default current_date,
    end_time date,
    position_id integer references position_type(id) on delete set null,
    CONSTRAINT mem_start_and_end_times_in_sequence
    CHECK (start_time <= end_time),
    CONSTRAINT mem_duplicate_records
    UNIQUE (assoc_id, position_id, start_time)
);
