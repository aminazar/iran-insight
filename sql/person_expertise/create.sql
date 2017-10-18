create table person_expertise(
    pid integer references person(pid),
    expertise_id integer references expertise(expertise_id),
    start_date date not null,
    primary key(pid, expertise_id)
);