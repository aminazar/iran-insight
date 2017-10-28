--CREATE EXTENSION if not exists postgis;
create table if not exists business (
    bid serial not null primary key,
    name varchar(50) not null unique,
    name_fa varchar(50) not null unique,
    logo varchar(255),
    ceo_pid integer references person(pid),
    biz_type_id integer references business_type(id),
    address varchar(255),
    address_fa varchar(255),
--    geo_location geography,
    tel varchar(12),
    url varchar(30),
    general_stats jsonb,
    financial_stats jsonb
);