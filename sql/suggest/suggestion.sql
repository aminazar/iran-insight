select ${select_clause^}
from ${table_name~}
where
((${phrase} is null) or (lower(${field_name~}) like '%'||lower(${phrase})||'%'))
and
${id_column~} not in (${ids:value})
order by  ${field_name~}
limit 5
