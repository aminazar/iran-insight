create table if not exists product(
    product_id serial primary key,
    business_id integer not null references business(bid),
    name varchar(100),
    name_fa varchar(100),
    description text,
    description_fa text,
    start_time timestamp with time zone not null default current_timestamp,
    end_time timestamp with time zone,
    parent_product_id integer references product(product_id),
    tags text[],
    CONSTRAINT product_start_and_end_time_in_sequence
    CHECK (start_time < end_time),
    constraint chk_name
    CHECK (name is not null or name_fa is not null)
)