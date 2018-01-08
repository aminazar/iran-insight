select business.bid
from ${tableName~}
join association
on ${tableName~}.assoc_id = association.aid
left outer join business on business.bid = association.bid
where ${tableName~}.id = ${id}