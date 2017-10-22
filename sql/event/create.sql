create table if not exists event(
    eid serial not null primary key,
    organizer_pid integer references person(pid),
    organizer_oid integer references organization(oid),
    organizer_bid integer references business(bid),
    title varchar(100) not null unique,
    title_fa varchar(100) not null unique,
    address varchar(100),
    address_fa varchar(100),
--    geo_location geography,
    start_date date not null,
    end_date date,
    description text,
    description_fa text
)