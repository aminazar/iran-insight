CREATE TABLE if not exists organization(
    oid serial not null primary key,
    name varchar(50) not null unique,
    ceo_pid integer,
    org_type_id integer
--    org_type_id integer references organization_type(org_type_id)
)