create table if not exists person_expertise(
    peid serial not null primary key,
    pid integer references person(pid),
    expertise_id integer references expertise(expertise_id) not null,

  CONSTRAINT person_experties_duplicate_records
  UNIQUE (pid ,expertise_id)

);