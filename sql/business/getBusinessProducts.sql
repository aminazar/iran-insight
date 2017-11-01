select *
from product
join business_product on business_product.product_id = product.product_id
where business_product.bid = ${bid}