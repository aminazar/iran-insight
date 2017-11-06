select person.*
from subscription
join person on subscription.subscriber_id = person.pid
where subscription.oid = ${oid}