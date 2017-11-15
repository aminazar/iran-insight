select
    *
from
    membership
join
    association
on
    membership.assoc_id = association.aid
where
    mid = ${mid}