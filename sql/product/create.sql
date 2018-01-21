create table if not exists product(
    product_id serial primary key,
    business_id integer not null references business(bid) on delete cascade,
    name varchar(100),
    name_fa varchar(100),
    description text,
    description_fa text,
    start_time date not null default current_date,
    end_time date,
    parent_product_id integer references product(product_id),
    tags text[] DEFAULT array[]::text[],
    CONSTRAINT product_start_and_end_times_in_sequence
    CHECK (start_time <= end_time),
    constraint chk_name
    CHECK (name is not null or name_fa is not null)
)