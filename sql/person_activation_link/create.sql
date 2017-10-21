create table person_activation_link(
    pid integer not null references person(pid) on delete cascade on update cascade,
    link varchar(100) not null unique
)