CREATE TABLE if not exists organization_lce(
    id serial not null primary key,
    name varchar(50) not null,
    oid1 integer not null references organization(oid),
    oid2 integer references organization(oid),
    start_date timestamp without time zone not null,
    end_date timestamp without time zone not null,
description varchar(50),
lce_type_id integer references lce_type(lce_type_id)

)