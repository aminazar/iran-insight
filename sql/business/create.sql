--CREATE EXTENSION if not exists postgis;
create table if not exists business (
    bid serial not null primary key,
    name varchar(50) unique,
    name_fa varchar(50) unique,
    logo varchar(255),
    ceo_pid integer references person(pid) on delete set null,
    biz_type_id integer references business_type(id) on delete set null,
    address varchar(255),
    address_fa varchar(255),
--    geo_location geography,
    latitude real,
    longitude real,
    tel varchar(12),
    url varchar(30),
    tags text[] DEFAULT array[]::text[],
    start_date date not null default current_date,
    end_date date,
    general_stats jsonb,
    financial_stats jsonb,
    constraint chk_name check (name is not null or name_fa is not null),
     CONSTRAINT biz_start_and_end_dates_in_sequence
     CHECK (start_date <= end_date)
);