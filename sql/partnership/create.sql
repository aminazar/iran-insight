CREATE TABLE if not exists partnership(
    id serial not null primary key,
    pid1 integer not null references person(pid),
    pid2 integer not null references person(pid),
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone ,
    description varchar (200),
    description_fa varchar(200),
    is_confirmed boolean default false, -- pid2 must confirm partnership
    CONSTRAINT start_and_end_dates_in_sequence
    CHECK (start_date <= end_date),
    CONSTRAINT partnership_duplicate_records
    UNIQUE (pid1 ,pid2, start_date)

)