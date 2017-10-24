create table if not exists expertise(
    expertise_id serial not null primary key,
    name_en varchar(30) not null,
    name_fa varchar(30) not null,
    type_en varchar(20) not null,
    type_fa varchar(20) not null,
    is_education boolean not null
);