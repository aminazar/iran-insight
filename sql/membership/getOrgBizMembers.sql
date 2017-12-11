select
former. *,
position_type.name as position_name,
position_type.name_fa as position_name_fa,
position_type.active as position_active

from
    (select
    membership.mid,
      membership.is_active,
      membership.is_representative,
      membership.start_time,
      membership.end_time,
      membership.position_id
    from
    membership
    inner join
    association
    on
    association.aid = membership.assoc_id
    where
    (association.bid = ${bid} and ${bid} is not null and ${oid} is null) or (association.oid = ${oid} and ${oid} is not null and $(bid) is null)
    ) as former
left outer join
position_type
on
former.position_id = position_type.id