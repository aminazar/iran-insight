CREATE TABLE if not exists tag(
    tid serial not null primary key,
    name varchar(50) unique,
    active boolean default false -- only admin can change this
)
