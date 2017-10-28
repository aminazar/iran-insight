create table if not exists administrators(
    admin_id serial not null primary key,
    pid integer unique not null
);