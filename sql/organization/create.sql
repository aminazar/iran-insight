CREATE TABLE if not exists organization(
    oid serial not null primary key,
    name varchar(50) not null unique,
    name_fa varchar(50) not null unique,
    ceo_pid integer references person(pid),
    org_type_id integer references organization_type(id)
)