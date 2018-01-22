select
${tableName~}.*,
person.display_name_en as person_display_name,
person.display_name_fa as person_display_name_fa
from
${tableName~}
inner join
person
on ${tableName~}.suggested_by  = person.pid
where ${tableName~}.id = ${id};