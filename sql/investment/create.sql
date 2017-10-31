create table if not exists investment(
    id serial not null primary key,
    assoc_id integer references association(aid),
    amount money,
    currency char(3),
    investment_cycle smallint,
    is_lead boolean not null default false,
    is_confirmed boolean not null default false,
    claimed_by integer not null references person(pid),
    confirmed_by integer references person(pid),
    saved_at timestamp with time zone not null default current_timestamp,
    is_claimed_by_biz boolean not null default false,
    constraint currency_amount check((amount is null and currency is null) or (amount is not null and currency is not null))
);
