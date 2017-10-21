create table if not exists person(
    pid serial not null primary key,
    firstname varchar(20),
    surename varchar(20),
    username varchar(25) not null unique,
    secret varchar(200),
    is_user boolean default true,
    display_name varchar(30)
);