create table if not exists membership(
    mid serial not null primary key,
    assoc_id integer references association(aid),
    is_active boolean default false not null,
    is_representative boolean default false not null,
    start_time timestamp with time zone not null default current_timestamp,
    end_time timestamp with time zone,
    position_id integer references position_type(id)
);
