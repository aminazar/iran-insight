create table if not exists position_type(
    posid serial not null primary key,
    position varchar(255) not null unique,
    position_fa varchar(255) not null unique
);