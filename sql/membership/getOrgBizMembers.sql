select
second.mid,
second.username,
second.display_name_en,
second.display_name_fa,
second.is_active,
second.is_representative,
second.position_id,
second.person_pid,

position_type.name as position_name,
position_type.name_fa as position_name_fa,
position_type.active as position_active
from
    (select
	 *
     from
    membership
    inner join
        (select
         *,
         person.pid as person_pid
         from
         association
         inner join
         person
         on
         person.pid = association.pid
        ) as first
    on
    first.aid = membership.assoc_id
    where
    ((first.bid = ${bid} and ${bid} is not null and ${oid} is null) or (first.oid = ${oid} and ${oid} is not null and ${bid} is null)) and
     ( membership.end_time is null or membership.end_time > current_timestamp )
    ) as second
left outer join
position_type
on
second.position_id = position_type.id