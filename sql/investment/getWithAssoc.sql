select
    *
from
    investment
join
    association
on
    investment.assoc_id = association.aid
where
    id = ${id}