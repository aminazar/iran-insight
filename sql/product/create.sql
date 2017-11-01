create table if not exists product(
    product_id serial primary key,
    name varchar(100) not null,
    name_fa varchar(100) not null,
    description text,
    description_fa text,
    parent_product_id integer references product(product_id)
)