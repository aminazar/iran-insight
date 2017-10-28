create table if not exists expertise(
    expertise_id serial not null primary key,
    name_en varchar(100) not null,
    name_fa varchar(100) not null,
    start_date date not null,
    end_date date,
    is_education boolean not null
);