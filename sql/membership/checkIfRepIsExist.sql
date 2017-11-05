--select * from association where ((bid in ( select bid from association where aid = ${aid} )) or (oid in ( select oid from association where aid = ${aid} )) and pid is not null ) as test;
select
    *
from
     membership
join
    (select
        *
    from
        association
    where
        ((bid in
            (select
                bid
            from
                association
            where
                aid = ${aid} ))
            or
            (oid in
                (select
                    oid
                 from
                    association
                 where
                    aid = ${aid} ))
            and
                pid is not null)
        ) newTable
on
    assoc_id = newTable.aid and
    is_active = false and
    is_representative = true