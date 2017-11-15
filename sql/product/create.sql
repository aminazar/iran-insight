create table if not exists product(
    product_id serial primary key,
    name varchar(100),
    name_fa varchar(100),
    description text,
    description_fa text,
    parent_product_id integer references product(product_id),
    tags text[],
    constraint chk_name check (name is not null or name_fa is not null)
)