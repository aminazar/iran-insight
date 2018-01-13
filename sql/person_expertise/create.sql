create table if not exists person_expertise(
    peid serial not null primary key,
    pid integer references person(pid) on delete cascade,
    expertise_id integer not null references expertise(expertise_id) on delete cascade,

  CONSTRAINT person_experties_duplicate_records
  UNIQUE (pid ,expertise_id)

);