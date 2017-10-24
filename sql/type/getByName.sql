select
    *
from
    ${tableName~}
where
    lower(name)=lower(${name})