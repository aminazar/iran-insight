CREATE TABLE if not exists tag(
    tid serial not null primary key,
    name varchar(50) unique,
    proposer jsonb default '{"business" :[] , "organization":[] , "product":[]}'::jsonb -- list of proposers which has suggested tag and, waiting for confirm by admin

)
