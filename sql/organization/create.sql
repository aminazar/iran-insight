CREATE TABLE if not exists organization(
    oid serial not null primary key,
    name varchar(50) unique,
    name_fa varchar(50) unique,
    ceo_pid integer references person(pid) on delete set null,
    org_type_id integer references organization_type(id) on delete set null,
    start_date date not null default current_date,
    end_date date,
    tags text[] DEFAULT array[]::text[],
    constraint chk_name check (name is not null or name_fa is not null),
    CONSTRAINT org_start_and_end_dates_in_sequence
    CHECK (start_date <= end_date)
)