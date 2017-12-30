CREATE TABLE if not exists tag_connection(
    id serial not null primary key,
    tid1 integer references tag(tid) not null,
    tid2 integer references tag(tid) not null,
    affinity integer default 5,

    CONSTRAINT tag_connection_duplicate_records
    UNIQUE (tid1,tid2),

    constraint chk_not_equal_tid check ( tid1 != tid2  )
)

