select
    product.product_id,
    product.name,
    product.name_fa,
    product.description,
    product.description_fa,
    product.parent_product_id,
    parent_product.name as parent_product_name,
    parent_product.name_fa as parent_product_name_fa,
    business_product.market_share,
    business_product.bpid
from business_product
join product on business_product.product_id = product.product_id
left outer join product as parent_product on product.parent_product_id = parent_product.product_id
where business_product.bid = ${bid}