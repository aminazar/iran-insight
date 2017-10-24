-- temporal LCE table based on Kuznetsov’s History Table and some modification
CREATE TABLE if not exists  organization_lce(
    id serial not null primary key,
    oid1 integer not null references organization(oid),
    oid2 integer references organization(oid),
    previous_end_date timestamp without time zone, -- null means first lce
    current_start_date timestamp without time zone NOT NULL,
    current_end_date timestamp without time zone , -- null means unfinished current lce
    description varchar (200),
    description_fa varchar(200),
    lce_type_id integer references lce_type(id),
  CONSTRAINT previous_end_date_and_current_start_in_sequence
  CHECK (previous_end_date <= current_start_date),
  CONSTRAINT current_start_and_end_dates_in_sequence
  CHECK (current_start_date <= current_end_date),
  CONSTRAINT end_dates_in_sequence
  CHECK (previous_end_date <> current_end_date),
  CONSTRAINT unique_oid1_start_date
  UNIQUE (oid1, current_start_date),
  CONSTRAINT unique_oid1_previous_end_date
  UNIQUE (oid1, previous_end_date), -- null first lce
  CONSTRAINT unique_oid1_current_end_date
  UNIQUE (oid1, current_end_date), -- one null current lce
  FOREIGN KEY (oid1, previous_end_date)  -- self-reference
  REFERENCES organization_lce (oid1, current_end_date)
  );

  CREATE UNIQUE INDEX oid1_current_start_dates_when_end_dates_are_null ON organization_lce (oid1) WHERE current_end_date IS NULL;