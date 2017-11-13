CREATE TABLE if not exists tag(
    tid serial not null primary key,
    name varchar(50) unique,
    proposer jsonb

)