create table if not exists person(
    pid serial not null primary key,
    firstname_en varchar(20),
    firstname_fa varchar(20),
    surname_en varchar(20),
    surname_fa varchar(20),
    username varchar(25) not null unique,
    secret varchar(200),
    is_user boolean default true,
    display_name_en varchar(30),
    display_name_fa varchar(30)
);