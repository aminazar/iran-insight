select
    tag.tid,
    tag.name,
    tag.active
from
    tag
inner join
    (
        select
            tc.tid1,
            tc.tid2,
        	tc.affinity
        from tag
        inner join tag_connection as tc
        on tag.tid = tc.tid1 or tag.tid = tc.tid2
        where tag.name = ${name} and tc.affinity > 10
     ) as tc
on tag.tid = tc.tid1 or tag.tid = tc.tid2
where name != ${name} and active = true
