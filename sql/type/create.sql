CREATE TABLE if not exists ${tableName~}(
    id serial not null primary key,
    name varchar(50) not null unique,
    name_fa varchar(50) not null unique,
    suggested_by integer references person(pid),
    active boolean not null default false
)