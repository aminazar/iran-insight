select *
from business_product
join product on business_product.product_id = product.product_id
where business_product.bid = ${bid}