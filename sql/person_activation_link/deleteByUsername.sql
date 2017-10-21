delete from person_activation_link
where pid in (select pid from person where username = ${username})