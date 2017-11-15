CREATE TABLE if not exists ${tableName~}(
    id serial not null primary key,
    name varchar(50) unique,
    name_fa varchar(50)unique,
    suggested_by integer references person(pid),
    ${extraSQL^}
    active boolean not null default false,
    constraint chk_name check (name is not null or name_fa is not null)
)