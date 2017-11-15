CREATE TABLE if not exists  organization_lce(
    id serial not null primary key,
    oid1 integer not null references organization(oid),
    oid2 integer references organization(oid),
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone ,
    description varchar (200),
    description_fa varchar(200),
    aid integer references association(aid),
    lce_type_id integer not null references lce_type(id),
    is_confirmed boolean default false, -- oid2 rep must confirm when oid2 is not null
  CONSTRAINT start_and_end_dates_in_sequence
  CHECK (start_date <= end_date),
  CONSTRAINT org_duplicate_records
  UNIQUE (oid1 ,start_date, lce_type_id )
  );