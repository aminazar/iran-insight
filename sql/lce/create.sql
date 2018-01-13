CREATE TABLE if not exists  ${tableName~}( -- lce or organization_lce
    id serial not null primary key,
    id1 integer not null references ${possessorName~}(${possessorIdName^}),
    id2 integer references ${possessorName~}(${possessorIdName^}),
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone ,
    description varchar (200),
    description_fa varchar(200),
    aid integer references association(aid),
    lce_type_id integer not null references lce_type(id),
     is_confirmed boolean default false, -- id2 rep must confirm when bid2 is not null
  CONSTRAINT start_and_end_dates_in_sequence
  CHECK (start_date <= end_date),
  CONSTRAINT ${tableName^}_duplicate_records
  UNIQUE (id1 ,start_date, lce_type_id )
  );