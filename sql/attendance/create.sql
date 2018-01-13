create table if not exists attendance(
    id serial not null primary key,
    pid integer references person(pid) on delete cascade,
    oid integer references organization(oid) on delete cascade,
    bid integer references business(bid) on delete cascade,
    eid integer references event(eid) on delete cascade,
    attendance_type_id integer references attendance_type(id),
    saved_at timestamp with time zone not null default current_timestamp,
    saved_by integer not null references person(pid),
    constraint has_attendee_id CHECK(pid is not null or oid is not null or bid is not null),
    unique(pid, oid, bid, eid)
)