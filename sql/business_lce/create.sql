CREATE TABLE if not exists  business_lce(
    id serial not null primary key,
    bid1 integer not null references business(bid),
    bid2 integer references business(bid),
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone ,
    description varchar (200),
    description_fa varchar(200),
    aid integer references association(aid),
    lce_type_id integer not null references lce_type(id),
  CONSTRAINT start_and_end_dates_in_sequence
  CHECK (start_date <= end_date),
  CONSTRAINT biz_duplicate_records
  UNIQUE (bid1 ,start_date, lce_type_id )
  );