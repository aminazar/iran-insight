create table if not exists ex_data(
    eid serial primary key,
    name varchar(100),
    market_share real,
    type varchar(50),
    class varchar(50),
    category varchar(50),
    hhi real,
    province varchar(20)
)