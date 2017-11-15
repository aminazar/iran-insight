--CREATE EXTENSION if not exists
create table if not exists association(
    aid serial not null primary key,
    pid integer references person(pid),
    bid integer references business(bid),
    oid integer references organization(oid),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    constraint chk_association check ((pid is not null and bid is not null and oid is null) or (pid is not null and oid is not null and bid is null) or (bid is not null and oid is not null and pid is null))
);


