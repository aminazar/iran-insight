--CREATE EXTENSION if not exists
create table if not exists association(
    aid serial not null primary key,
    pid integer references person(pid),
    bid integer references business(bid),
    oid integer references organization(oid),
    start_date date,
    end_date date
);

