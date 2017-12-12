select ${field_name~}, ${id_column~}
from ${table_name~}
where
((${phrase} is null) or (lower(${field_name~}) like '%'||lower(${phrase})||'%'))
and
${id_column~} not in (${ids:value})