CREATE TABLE if not exists attendance_type(
    id serial not null primary key,
    name varchar(50) not null unique,
    name_fa varchar(50) not null unique
)