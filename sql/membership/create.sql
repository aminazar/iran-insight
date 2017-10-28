create table if not exists membership(
    mid serial not null primary key,
    assoc_id integer references association(aid),
    is_active boolean default false not null,
    is_representative boolean default false not null,
    position_id integer references position_type(id),
    constraint associd_position_is_unique
        unique(assoc_id, position_id)
);
