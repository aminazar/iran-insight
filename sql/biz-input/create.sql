create table if not exists ${tableName~}(
    id serial not null primary key,
    assoc_id integer references association(aid),
    ${extraSQL^}
    claimed_by integer not null references person(pid),
    confirmed_by integer references person(pid),
    saved_at timestamp with time zone not null default current_timestamp,
    is_claimed_by_biz boolean not null default false,
    constraint currency_amount check((amount is null and currency is null) or (amount is not null and currency is not null))
);
