create table if not exists expertise(
    expertise_id serial not null primary key,
    name varchar(30) not null,
    type varchar(20) not null
);