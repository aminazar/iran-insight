CREATE TABLE if not exists organization_lce(
    id serial not null primary key,
    oid1 integer not null references organization(oid),
    oid2 integer references organization(oid),
    start_date timestamp without time zone not null,
    start_date_fa varchar(20) not null,
    end_date timestamp without time zone,
    end_date_fa varchar(20),
description varchar(100),
description_fa varchar(100),
lce_type_id integer references lce_type(lce_type_id)

)
