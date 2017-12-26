select
business.*,
product.name as product_name,
product.name_fa  as product_name_fa,
product.product_id as product_id,
product.start_time as product_start_time,
product.end_time as product_end_time
from business
     join product on product.business_id = business.bid
where product.product_id = ${product_id}