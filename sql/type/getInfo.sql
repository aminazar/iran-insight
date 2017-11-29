select
${tableName~}.*,
person.username
from
${tableName~}
inner join
person
on ${tableName~}.suggested_by  = person.pid
where ${tableName~}.id = ${id};