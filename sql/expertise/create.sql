create table if not exists expertise(
    expertise_id serial not null primary key,
    name_en varchar(100) not null,
    name_fa varchar(100) not null,
    is_education boolean not null default false,
    CONSTRAINT exp_duplicate_records
  UNIQUE (name_en ,name_fa)
);