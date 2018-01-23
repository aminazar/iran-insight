create table if not exists ${tableName~}(
    id serial not null primary key,
    assoc_id integer not null references association(aid) on delete cascade,
    ${extraSQL^}
    claimed_by integer not null references person(pid),
    confirmed_by integer references person(pid),
    is_confirmed boolean not null default false,
    saved_at timestamp with time zone not null default current_timestamp,
    is_claimed_by_biz boolean not null default false
);
