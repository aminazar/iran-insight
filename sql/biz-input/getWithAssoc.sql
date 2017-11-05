select
    *
from
    ${tableName~}
join
    association
on
    ${tableName~}.assoc_id = association.aid
where
    id = ${id}