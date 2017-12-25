select ${field_name~}, ${field_name_fa~}, ${id_column~}
from ${table_name~}
where
((${phrase} is null) or (lower(${field_name~}) like '%'||lower(${phrase})||'%'))
and
${id_column~} not in (${ids:value})
order by  ${field_name~}
limit 5
