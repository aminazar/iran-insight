select
    *
from
    product
where
    business_id = ${bid}
    and start_time < current_timestamp
    and end_time is not null
    and end_time > current_timestamp