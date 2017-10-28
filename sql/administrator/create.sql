create table if not exists administrator(
    aid serial not null primary key,
    pid integer references person(pid)
)