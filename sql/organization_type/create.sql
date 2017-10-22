CREATE TABLE if not exists organization_type(
    org_type_id serial not null primary key,
    name varchar(50) not null unique,
    name_fa varchar(50) not null unique
)