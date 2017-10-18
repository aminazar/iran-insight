CREATE TABLE if not exists lce_type(
    lce_type_id serial not null primary key,
    name varchar(50) not null unique,
    is_killer boolean not null default false
)