create table if not exists business_product(
    bid integer not null references business(bid),
    product_id integer not null references product(product_id),
    market_share real,
    CONSTRAINT unique_ids
    UNIQUE (bid, product_id)
)