select
    business.*,
    product.name as product_name,
    product.name_fa  as product_name_fa
from business
join business_product on business.bid = business_product.bid
join product on business_product.product_id = product.product_id
where business.bid = ${bid} and product.product_id = ${product_id}