select
    count(*) over () as total,
    ${tableName~}.*
from
    ${tableName~}
where
    (${phrase} is not null and (
        ${idColumn~} in (
            select ${idColumn~}
            from unnest(tags) a
            join tag on a = tag.name
            where tag.active = true and lower(a) like '%'||lower(${phrase})||'%'
        )
    )) or ${phrase} is null
order by ${idColumn~} DESC limit ${limit} offset ${offset}