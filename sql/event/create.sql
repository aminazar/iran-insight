create table if not exists event(
    eid serial not null primary key,
    organizer_pid integer references person(pid),
    organizer_oid integer references organization(oid),
    organizer_bid integer references business(bid),
    title varchar(100) not null unique,
    title_fa varchar(100) not null unique,
    address varchar(100),
    address_fa varchar(100),
 --   geo_location geography,
    start_date date not null,
    end_date date,
    description text,
    description_fa text,
    saved_at timestamp with time zone not null default current_timestamp,
    saved_by integer not null references person(pid),
    constraint has_organizer CHECK(organizer_pid is not null or organizer_oid is not null or organizer_bid is not null)
)