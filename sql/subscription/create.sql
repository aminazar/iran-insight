create table if not exists subscription(
    sid serial not null primary key,
    subscriber_id integer not null references person(pid),
    pid integer references person(pid),
    bid integer references business(bid),
    oid integer references organization(oid),
    CONSTRAINT two_is_null CHECK((pid != null and bid = null and oid = null) or (pid = null and bid != null and oid = null) or (pid = null and bid = null and oid != null)),
    CONSTRAINT sub_unique_ids UNIQUE(subscriber_id, pid, bid, oid),
    CONSTRAINT diff_pids CHECK(subscriber_id != pid)
);