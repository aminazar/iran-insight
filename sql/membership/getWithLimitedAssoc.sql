select
    *
from
    membership
join
    association
on
    association.aid = ${aid}
    and membership.assoc_id = association.aid
where
    mid = ${mid}