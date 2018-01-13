--CREATE EXTENSION if not exists
create table if not exists association(
    aid serial not null primary key,
    pid integer references person(pid) on delete cascade,
    bid integer references business(bid) on delete cascade,
    oid integer references organization(oid) on delete cascade,
    start_time timestamp with time zone not null default current_timestamp,
    end_time timestamp with time zone,
    constraint chk_association check ((pid is not null and bid is not null and oid is null) or (pid is not null and oid is not null and bid is null) or (bid is not null and oid is not null and pid is null))
);


