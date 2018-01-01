create table if not exists person(
    pid serial not null primary key,
    firstname_en varchar(20),
    firstname_fa varchar(20),
    surname_en varchar(20),
    surname_fa varchar(20),
    username varchar(100) not null unique,
    secret varchar(200),
    image varchar(300),
    address_en varchar(500),
    address_fa varchar(500),
    phone_no varchar(20),
    mobile_no varchar(20),
    birth_date date,
    notify_period varchar(1) default 'd',
    is_user boolean default true,
    display_name_en varchar(30),
    display_name_fa varchar(30),
    CONSTRAINTS one_display_name
    CHECK (display_name_en is not null or display_name_fa is not null)
);