create table if not exists expertise(
    expertise_id serial not null primary key,
    name_en varchar(100) not null,
    name_fa varchar(100) not null,
    type_en varchar(50) not null,
    type_fa varchar(50) not null,
    is_education boolean not null
);