create table if not exists attendance(
    id serial not null primary key,
    pid integer references person(pid),
    oid integer references organization(oid),
    bid integer references business(bid),
    eid integer references event(eid),
    attendance_type_id integer references attendance_type(id),
    saved_at timestamp with time zone not null default current_timestamp,
    constraint has_organizer CHECK(pid is not null or oid is not null or bid is not null)
)