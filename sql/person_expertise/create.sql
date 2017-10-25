create table if not exists person_expertise(
    peid serial not null primary key,
    pid integer references person(pid),
    expertise_id integer references expertise(expertise_id),
    start_date date not null,
    end_date date
);