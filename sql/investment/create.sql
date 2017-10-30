create table if not exists investment(
    id serial not null primary key,
    assoc_id integer references association(aid),
    amount money,
    currency char(3),
    investment_cycle smallint,
    is_lead boolean not null default false,
    constraint currency_amount check((amount is null and currency is null) or (amount is not null and currency is not null))
);
