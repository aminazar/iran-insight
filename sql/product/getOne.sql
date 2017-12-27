select
    *
from
    product
where
        business_id = ${business_id}
    and
        start_time <= current_timestamp
    and (
            end_time is null
        or
            end_time > current_timestamp
        )
order by
    start_time
limit 1