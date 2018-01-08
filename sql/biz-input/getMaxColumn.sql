select max(${col^})
from ${tableName~} as t
join association on t.assoc_id = association.aid
where association.bid = ${bid} and is_confirmed = true