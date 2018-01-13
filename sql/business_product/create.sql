create table if not exists business_product(
    bpid serial primary key,
    bid integer not null references business(bid) on delete cascade,
    product_id integer not null references product(product_id),
    market_share real,
    CONSTRAINT unique_ids
    UNIQUE (bid, product_id)
)